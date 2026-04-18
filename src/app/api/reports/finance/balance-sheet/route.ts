import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // === AKTIVA (ASSETS) ===

    // 1. Kas / Bank: Akumulasi semua income - expense sepanjang masa
    const [cashRow]: any = await db.query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as cash_balance
      FROM transactions WHERE status != 'void'
    `);
    const cashBalance = Number(cashRow.cash_balance) || 0;

    // 2. Piutang (Receivables)
    // a. Piutang dari module Hutang/Piutang
    const [receivableRow]: any = await db.query(`
      SELECT SUM(total_amount - paid_amount) as total
      FROM debts WHERE debt_type = 'receivable' AND status = 'active'
    `);
    const debtReceivable = Number(receivableRow.total) || 0;

    // b. Piutang dari COA Aset lainnya (misal: Kasbon Karyawan 1-1400)
    // Rumus: SUM(Expense - Income) karena Kasbon keluar (Asset+) dicatat sebagai 'expense' di table transactions
    const [coaReceivableRow]: any = await db.query(`
      SELECT SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE -t.amount END) as total
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE c.account_group = 'asset' AND c.code NOT IN ('1-1100', '1-1200', '1-1210')
        AND t.status NOT IN ('void', 'void_reversal')
    `);
    const coaReceivable = Number(coaReceivableRow.total) || 0;
    const totalReceivable = debtReceivable + coaReceivable;

    // 3. Persediaan Barang (Inventory at cost)
    const [inventoryRow]: any = await db.query(`
      SELECT SUM(stock * purchase_price) as total_value
      FROM inventory_items WHERE stock > 0
    `);
    const inventoryValue = Number(inventoryRow.total_value) || 0;

    const totalAssets = cashBalance + totalReceivable + inventoryValue;

    // === PASIVA (LIABILITIES + EQUITY) ===

    // 4. Hutang (Payables)
    const [payableRow]: any = await db.query(`
      SELECT SUM(total_amount - paid_amount) as total
      FROM debts WHERE debt_type = 'payable' AND status = 'active'
    `);
    const totalPayable = Number(payableRow.total) || 0;

    // 5. Modal/Equity = Total Assets - Total Liabilities
    const equity = totalAssets - totalPayable;

    // 6. Laba Tahun Berjalan (Net Profit for selected year - STRICT COA GROUPS)
    const [yearProfitRow]: any = await db.query(`
      SELECT 
        SUM(CASE WHEN c.account_group = 'revenue' THEN t.amount ELSE 0 END) -
        SUM(CASE WHEN c.account_group = 'expense' THEN t.amount ELSE 0 END) as net_profit
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE YEAR(t.trx_date) = ? AND t.status NOT IN ('void', 'void_reversal')
    `, [year]);
    const yearNetProfit = Number(yearProfitRow.net_profit) || 0;

    // 7. Laba Ditahan (Retained Earnings = equity including current year)
    const retainedEarnings = equity - yearNetProfit;

    return NextResponse.json({
      success: true,
      data: {
        year,
        assets: {
          cash: cashBalance,
          receivables: totalReceivable,
          inventory: inventoryValue,
          total: totalAssets
        },
        liabilities: {
          payables: totalPayable,
          total: totalPayable
        },
        equity: {
          retained_earnings: retainedEarnings,
          current_year_profit: yearNetProfit,
          total: equity
        },
        totalLiabilitiesAndEquity: totalPayable + equity
      }
    });
  } catch (error) {
    console.error('Balance Sheet API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
