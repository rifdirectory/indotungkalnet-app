import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('periodType') || 'monthly';
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let start: string;
    let end: string;

    if (periodType === 'monthly') {
      start = `${year}-${month.padStart(2, '0')}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      end = `${year}-${month.padStart(2, '0')}-${lastDay}`;
    } else if (periodType === 'yearly') {
      start = `${year}-01-01`;
      end = `${year}-12-31`;
    } else {
      start = startDate || `${year}-01-01`;
      end = endDate || `${year}-12-31`;
    }

    // === AKTIVITAS OPERASIONAL ===
    // Filtered by revenue/expense COA groups to avoid non-operational inflows (like loans) or outflows (like debt payment)
    const operationalIncomeQuery = `
      SELECT SUM(t.amount) as total, c.name as category
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE t.type = 'income' AND t.trx_date BETWEEN ? AND ? AND t.status = 'completed'
        AND c.account_group = 'revenue'
      GROUP BY fc.id, fc.name
    `;
    const operationalIncome: any = await db.query(operationalIncomeQuery, [start, end]);

    const operationalExpenseQuery = `
      SELECT SUM(t.amount) as total, fc.name as category
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE t.type = 'expense' AND t.trx_date BETWEEN ? AND ? AND t.status = 'completed'
        AND c.account_group = 'expense'
        AND fc.id != 28 -- Exclude Logistics Category (moved to Investment)
      GROUP BY fc.id, fc.name
    `;
    const operationalExpense: any = await db.query(operationalExpenseQuery, [start, end]);

    const totalOperationalIn = operationalIncome.reduce((a: number, r: any) => a + Number(r.total), 0);
    const totalOperationalOut = operationalExpense.reduce((a: number, r: any) => a + Number(r.total), 0);
    const netOperational = totalOperationalIn - totalOperationalOut;

    // 1. Inventory Purchases (from logs)
    const [inventoryInRow]: any = await db.query(`
      SELECT SUM(il.quantity * il.purchase_price) as total
      FROM inventory_logs il
      WHERE il.type = 'IN' 
        AND il.created_at BETWEEN ? AND ?
        AND (il.reference_id IS NULL OR il.reference_id NOT LIKE 'TRX-%') -- Avoid double counting with finance trx
    `, [start + ' 00:00:00', end + ' 23:59:59']);
    const inventoryInTotal = Number(inventoryInRow?.total) || 0;

    // 2. Asset Transactions (Fixed Assets 1-2xxx and Hardware Cat 28)
    const [assetTrxRow]: any = await db.query(`
      SELECT SUM(t.amount) as total
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE t.type = 'expense' AND t.status = 'completed'
        AND (c.code LIKE '1-2%' OR fc.id = 28) -- Fixed Assets or Logistik Hardware
        AND t.trx_date BETWEEN ? AND ?
    `, [start, end]);
    const assetTrxTotal = Number(assetTrxRow?.total) || 0;

    const inventoryPurchase = inventoryInTotal + assetTrxTotal;

    // 3. Asset Sales / Inventory Sales
    const [inventorySaleRow]: any = await db.query(`
      SELECT SUM(il.quantity * ii.price) as total
      FROM inventory_logs il
      JOIN inventory_items ii ON il.item_id = ii.id
      WHERE il.type = 'OUT' 
        AND il.created_at BETWEEN ? AND ?
        AND il.scenario IN ('SALE', 'SALE_CASH', 'SALE_DEBT')
    `, [start + ' 00:00:00', end + ' 23:59:59']);
    const inventorySales = Number(inventorySaleRow?.total) || 0;
    const netInvestment = inventorySales - inventoryPurchase;

    // === AKTIVITAS PEMBIAYAAN ===
    // Financing Activities: Inflows from loans/piutang repayments, Outflows for debt repayments
    const [financingInRow]: any = await db.query(`
      SELECT SUM(t.amount) as total
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE t.type = 'income' AND t.status = 'completed'
        AND (c.account_group = 'liability' OR c.account_group = 'equity' OR (c.account_group = 'asset' AND c.code LIKE '1-14%'))
        AND t.trx_date BETWEEN ? AND ?
    `, [start, end]);
    const financingInflows = Number(financingInRow?.total) || 0;

    const [financingOutRow]: any = await db.query(`
      SELECT SUM(t.amount) as total
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE t.type = 'expense' AND t.status = 'completed'
        AND (c.account_group = 'liability' OR c.account_group = 'equity' OR (c.account_group = 'asset' AND c.code LIKE '1-14%'))
        AND t.trx_date BETWEEN ? AND ?
    `, [start, end]);
    const financingOutflows = Number(financingOutRow?.total) || 0;
    
    const netFinancing = financingInflows - financingOutflows;

    // Saldo Kas Awal
    const [openingCashRow]: any = await db.query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as opening
      FROM transactions
      WHERE trx_date < ? AND status != 'void'
    `, [start]);
    const openingCash = Number(openingCashRow?.opening) || 0;
    const closingCash = openingCash + netOperational + netInvestment + netFinancing;

    return NextResponse.json({
      success: true,
      data: {
        period: { start, end },
        operational: {
          inflows: operationalIncome,
          outflows: operationalExpense,
          totalIn: totalOperationalIn,
          totalOut: totalOperationalOut,
          net: netOperational
        },
        investment: {
          purchases: inventoryPurchase,
          sales: inventorySales,
          net: netInvestment
        },
        financing: {
          inflows: financingInflows,
          outflows: financingOutflows,
          net: netFinancing
        },
        summary: {
          openingCash,
          netOperational,
          netInvestment,
          netFinancing,
          closingCash
        }
      }
    });
  } catch (error) {
    console.error('Cash Flow API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
