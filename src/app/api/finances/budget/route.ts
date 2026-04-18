import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: Fetch budgets for a given month/year with actuals
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const start = `${year}-${month.padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const end = `${year}-${month.padStart(2, '0')}-${lastDay}`;

    // Get all categories with their budgets and actual spending
    const query = `
      SELECT 
        c.id,
        c.name as category_name,
        c.type,
        COALESCE(fb.amount, 0) as budget_amount,
        COALESCE(actual.total, 0) as actual_amount,
        fb.notes as budget_notes
      FROM finance_categories c
      LEFT JOIN finance_budgets fb ON fb.category_id = c.id AND fb.month = ? AND fb.year = ?
      LEFT JOIN (
        SELECT category_id, SUM(amount) as total
        FROM transactions
        WHERE trx_date BETWEEN ? AND ? AND status != 'void'
        GROUP BY category_id
      ) actual ON actual.category_id = c.id
      ORDER BY c.type, c.name
    `;

    const rows: any = await db.query(query, [month, year, start, end]);
    
    const income = rows.filter((r: any) => r.type === 'income');
    const expense = rows.filter((r: any) => r.type === 'expense');

    const totalBudgetIncome = income.reduce((a: number, r: any) => a + Number(r.budget_amount), 0);
    const totalActualIncome = income.reduce((a: number, r: any) => a + Number(r.actual_amount), 0);
    const totalBudgetExpense = expense.reduce((a: number, r: any) => a + Number(r.budget_amount), 0);
    const totalActualExpense = expense.reduce((a: number, r: any) => a + Number(r.actual_amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        period: { month, year, start, end },
        income,
        expense,
        summary: {
          totalBudgetIncome,
          totalActualIncome,
          totalBudgetExpense,
          totalActualExpense,
          budgetProfit: totalBudgetIncome - totalBudgetExpense,
          actualProfit: totalActualIncome - totalActualExpense
        }
      }
    });
  } catch (error) {
    console.error('Budget API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Upsert budget for a category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category_id, month, year, amount, notes } = body;

    if (!category_id || !month || !year || amount === undefined) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    await db.query(`
      INSERT INTO finance_budgets (category_id, month, year, amount, notes)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE amount = VALUES(amount), notes = VALUES(notes), updated_at = NOW()
    `, [category_id, month, year, amount, notes || null]);

    return NextResponse.json({ success: true, message: 'Anggaran berhasil disimpan.' });
  } catch (error: any) {
    console.error('Budget POST Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
