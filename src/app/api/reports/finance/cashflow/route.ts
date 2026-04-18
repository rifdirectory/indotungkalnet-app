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
    // Penerimaan dari pelanggan (income yang bukan investasi)
    const operationalIncomeQuery = `
      SELECT SUM(t.amount) as total, c.name as category
      FROM transactions t
      LEFT JOIN finance_categories c ON t.category_id = c.id
      WHERE t.type = 'income' AND t.trx_date BETWEEN ? AND ? AND t.status != 'void'
      GROUP BY c.id, c.name
    `;
    const operationalIncome: any = await db.query(operationalIncomeQuery, [start, end]);

    // Pembayaran biaya operasional (expense)
    const operationalExpenseQuery = `
      SELECT SUM(t.amount) as total, c.name as category
      FROM transactions t
      LEFT JOIN finance_categories c ON t.category_id = c.id  
      WHERE t.type = 'expense' AND t.trx_date BETWEEN ? AND ? AND t.status != 'void'
      GROUP BY c.id, c.name
    `;
    const operationalExpense: any = await db.query(operationalExpenseQuery, [start, end]);

    const totalOperationalIn = operationalIncome.reduce((a: number, r: any) => a + Number(r.total), 0);
    const totalOperationalOut = operationalExpense.reduce((a: number, r: any) => a + Number(r.total), 0);
    const netOperational = totalOperationalIn - totalOperationalOut;

    // === AKTIVITAS INVESTASI ===
    // Pembelian inventory (stock IN)
    const [investmentRow]: any = await db.query(`
      SELECT SUM(il.quantity * il.purchase_price) as total
      FROM inventory_logs il
      JOIN inventory_items ii ON il.item_id = ii.id
      WHERE il.type = 'IN' 
        AND il.created_at BETWEEN ? AND ?
        AND il.notes NOT LIKE '%Penyesuaian%'
    `, [start + ' 00:00:00', end + ' 23:59:59']);
    const inventoryPurchase = Number(investmentRow?.total) || 0;

    // Penjualan inventory (stock OUT yang ada harga jual)
    const [inventorySaleRow]: any = await db.query(`
      SELECT SUM(il.quantity * ii.price) as total
      FROM inventory_logs il
      JOIN inventory_items ii ON il.item_id = ii.id
      WHERE il.type = 'OUT' 
        AND il.created_at BETWEEN ? AND ?
        AND il.scenario = 'SALE'
    `, [start + ' 00:00:00', end + ' 23:59:59']);
    const inventorySales = Number(inventorySaleRow?.total) || 0;
    const netInvestment = inventorySales - inventoryPurchase;

    // === AKTIVITAS PEMBIAYAAN ===
    // Pembayaran hutang
    const [debtPaymentRow]: any = await db.query(`
      SELECT SUM(amount) as total
      FROM transactions
      WHERE type = 'expense' AND status != 'void'
        AND notes LIKE '%hutang%'
        AND trx_date BETWEEN ? AND ?
    `, [start, end]);
    const debtPayments = Number(debtPaymentRow?.total) || 0;

    // Penerimaan piutang
    const [receivableRow]: any = await db.query(`
      SELECT SUM(amount) as total
      FROM transactions
      WHERE type = 'income' AND status != 'void'
        AND notes LIKE '%piutang%'
        AND trx_date BETWEEN ? AND ?
    `, [start, end]);
    const receivableCollection = Number(receivableRow?.total) || 0;
    const netFinancing = receivableCollection - debtPayments;

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
          debtPayments,
          receivableCollection,
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
