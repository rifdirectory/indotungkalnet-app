import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year') || new Date().getFullYear().toString();
    const monthStr = searchParams.get('month') || (new Date().getMonth() + 1).toString();
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    // Calculate the last day of the selected month
    const targetDate = new Date(year, month, 0).toISOString().split('T')[0];

    // === AKTIVA (ASSETS) ===

    // 1. Kas / Bank: Akumulasi semua income - expense up to targetDate
    const [cashRow]: any = await db.query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as cash_balance
      FROM transactions 
      WHERE status NOT IN ('void', 'void_reversal')
        AND trx_date <= ?
    `, [targetDate]);
    const cashBalance = Number(cashRow.cash_balance) || 0;

    // 2. Piutang (Receivables)
    // a. Piutang dari module Hutang/Piutang (Historical Calculation)
    // Total Debt Amount (created before targetDate) - Payments (made before targetDate)
    const [receivableRow]: any = await db.query(`
      SELECT 
        SUM(d.total_amount) - 
        COALESCE((
          SELECT SUM(t.amount) 
          FROM transactions t 
          WHERE t.debt_id = d.id 
            AND t.status NOT IN ('void', 'void_reversal')
            AND t.trx_date <= ?
        ), 0) as total
      FROM debts d
      WHERE d.debt_type = 'receivable' 
        AND DATE(d.created_at) <= ?
    `, [targetDate, targetDate]);
    const debtReceivable = Number(receivableRow.total) || 0;

    // b. Piutang dari COA Aset lainnya (Historical)
    const [coaReceivableRow]: any = await db.query(`
      SELECT SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE -t.amount END) as total
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE c.account_group = 'asset' AND c.code NOT IN ('1-1100', '1-1200', '1-1210')
        AND t.status NOT IN ('void', 'void_reversal')
        AND t.trx_date <= ?
    `, [targetDate]);
    const coaReceivable = Number(coaReceivableRow.total) || 0;
    const totalReceivable = debtReceivable + coaReceivable;

    // 3. Persediaan Barang (Inventory at cost - Current state due to schema limitations)
    const [inventoryRow]: any = await db.query(`
      SELECT SUM(stock * purchase_price) as total_value
      FROM inventory_items WHERE stock > 0
    `);
    const inventoryValue = Number(inventoryRow.total_value) || 0;

    // 4. Aset Tetap (Fixed Assets - Historical)
    const [fixedAssetsRow]: any = await db.query(`
      SELECT 
        SUM(current_value) as total,
        SUM(CASE WHEN category = 'land' THEN current_value ELSE 0 END) as land,
        SUM(CASE WHEN category = 'infrastructure' THEN current_value ELSE 0 END) as infrastructure,
        SUM(CASE WHEN category = 'equipment' THEN current_value ELSE 0 END) as equipment,
        SUM(CASE WHEN category = 'vehicle' THEN current_value ELSE 0 END) as vehicle,
        SUM(CASE WHEN category = 'other' THEN current_value ELSE 0 END) as other
      FROM fixed_assets
      WHERE purchase_date <= ? OR purchase_date IS NULL
    `, [targetDate]);
    
    const fixedAssets = {
      total: Number(fixedAssetsRow.total) || 0,
      land: Number(fixedAssetsRow.land) || 0,
      infrastructure: Number(fixedAssetsRow.infrastructure) || 0,
      equipment: Number(fixedAssetsRow.equipment) || 0,
      vehicle: Number(fixedAssetsRow.vehicle) || 0,
      other: Number(fixedAssetsRow.other) || 0
    };

    const totalAssets = cashBalance + totalReceivable + inventoryValue + fixedAssets.total;

    // === PASIVA (LIABILITIES + EQUITY) ===

    // 5. Hutang Usaha (Accounts Payable)
    const [payableRow]: any = await db.query(`
      SELECT 
        SUM(d.total_amount) - 
        COALESCE((
          SELECT SUM(t.amount) 
          FROM transactions t 
          WHERE t.debt_id = d.id 
            AND t.status NOT IN ('void', 'void_reversal')
            AND t.trx_date <= ?
        ), 0) as total
      FROM debts d
      WHERE d.debt_type = 'payable' AND d.entity_type != 'bank'
        AND DATE(d.created_at) <= ?
    `, [targetDate, targetDate]);
    const accountsPayable = Number(payableRow.total) || 0;

    // 5b. Hutang Bank (Bank Loans from specific Debt Records)
    const [bankLoanRow]: any = await db.query(`
      SELECT 
        SUM(d.total_amount) - 
        COALESCE((
          SELECT SUM(t.amount) 
          FROM transactions t 
          WHERE t.debt_id = d.id 
            AND t.status NOT IN ('void', 'void_reversal')
            AND t.trx_date <= ?
        ), 0) as total
      FROM debts d
      WHERE d.debt_type = 'payable' AND d.entity_type = 'bank'
        AND DATE(d.created_at) <= ?
    `, [targetDate, targetDate]);
    const bankLoans = Number(bankLoanRow.total) || 0;

    const totalLiabilities = accountsPayable + bankLoans;

    // 6. Modal/Equity = Total Assets - Total Liabilities
    const equity = totalAssets - totalLiabilities;

    // 6. Laba Tahun Berjalan (Net Profit from beginning of year up to targetDate)
    const [yearProfitRow]: any = await db.query(`
      SELECT 
        SUM(CASE WHEN c.account_group = 'revenue' THEN t.amount ELSE 0 END) -
        SUM(CASE WHEN c.account_group = 'expense' THEN t.amount ELSE 0 END) as net_profit
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE YEAR(t.trx_date) = ? 
        AND t.trx_date <= ?
        AND t.status NOT IN ('void', 'void_reversal')
    `, [year, targetDate]);
    const yearNetProfit = Number(yearProfitRow.net_profit) || 0;

    // 7. Laba Ditahan (Retained Earnings = equity excluding current year snapshot)
    const retainedEarnings = equity - yearNetProfit;

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        asOf: targetDate,
        assets: {
          cash: cashBalance,
          receivables: totalReceivable,
          inventory: inventoryValue,
          fixed: fixedAssets,
          total: totalAssets
        },
        liabilities: {
          accounts_payable: accountsPayable,
          bank_loans: bankLoans,
          total: totalLiabilities
        },
        equity: {
          retained_earnings: retainedEarnings,
          current_year_profit: yearNetProfit,
          total: equity
        },
        totalLiabilitiesAndEquity: totalLiabilities + equity
      }
    });
  } catch (error) {
    console.error('Balance Sheet API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
