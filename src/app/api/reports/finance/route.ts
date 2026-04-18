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

    // 1. Calculate Summary (strict COA group check)
    const summaryQuery = `
      SELECT 
        SUM(CASE WHEN c.account_group = 'revenue' AND t.status NOT IN ('void', 'void_reversal') THEN t.amount ELSE 0 END) as revenue,
        SUM(CASE WHEN c.account_group = 'expense' AND t.status NOT IN ('void', 'void_reversal') THEN t.amount ELSE 0 END) as expense
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE t.trx_date BETWEEN ? AND ?
    `;
    const [summaryRows]: any = await db.query(summaryQuery, [start, end]);
    const summary = {
      revenue: Number(summaryRows.revenue) || 0,
      expense: Number(summaryRows.expense) || 0,
      netProfit: (Number(summaryRows.revenue) || 0) - (Number(summaryRows.expense) || 0)
    };

    // 2. Fetch Category Breakdown (strictly filter by Revenue/Expense groups)
    const breakdownQuery = `
      SELECT 
        fc.name as category,
        fc.type,
        fc.coa_code,
        SUM(t.amount) as amount
      FROM transactions t
      JOIN finance_categories fc ON t.category_id = fc.id
      JOIN chart_of_accounts c ON fc.coa_code = c.code
      WHERE t.trx_date BETWEEN ? AND ?
        AND t.status NOT IN ('void', 'void_reversal')
        AND c.account_group IN ('revenue', 'expense')
      GROUP BY fc.id, fc.name, fc.type, fc.coa_code
      ORDER BY fc.coa_code ASC
    `;
    const breakdownRows: any = await db.query(breakdownQuery, [start, end]);
    
    const incomeBreakdown = breakdownRows.filter((row: any) => row.type === 'income');
    const expenseBreakdown = breakdownRows.filter((row: any) => row.type === 'expense');

    // 3. Fetch Trend Data
    let trendQuery: string;
    let trendParams: any[];

    if (periodType === 'yearly') {
      // Monthly trend for the year (filtered by COA groups)
      trendQuery = `
        SELECT 
          MONTH(t.trx_date) as month,
          SUM(CASE WHEN c.account_group = 'revenue' AND t.status NOT IN ('void', 'void_reversal') THEN t.amount ELSE 0 END) as revenue,
          SUM(CASE WHEN c.account_group = 'expense' AND t.status NOT IN ('void', 'void_reversal') THEN t.amount ELSE 0 END) as expense
        FROM transactions t
        JOIN finance_categories fc ON t.category_id = fc.id
        JOIN chart_of_accounts c ON fc.coa_code = c.code
        WHERE t.trx_date BETWEEN ? AND ?
        GROUP BY MONTH(t.trx_date)
        ORDER BY month ASC
      `;
      trendParams = [start, end];
    } else {
      // Daily trend for the month or custom range (filtered by COA groups)
      trendQuery = `
        SELECT 
          t.trx_date as label,
          SUM(CASE WHEN c.account_group = 'revenue' AND t.status NOT IN ('void', 'void_reversal') THEN t.amount ELSE 0 END) as revenue,
          SUM(CASE WHEN c.account_group = 'expense' AND t.status NOT IN ('void', 'void_reversal') THEN t.amount ELSE 0 END) as expense
        FROM transactions t
        JOIN finance_categories fc ON t.category_id = fc.id
        JOIN chart_of_accounts c ON fc.coa_code = c.code
        WHERE t.trx_date BETWEEN ? AND ?
        GROUP BY t.trx_date
        ORDER BY t.trx_date ASC
      `;
      trendParams = [start, end];
    }

    const trendRows: any = await db.query(trendQuery, trendParams);

    // 4. Fetch Debt & Receivable Summaries
    const debtsQuery = `
      SELECT d.*, 
             CASE 
               WHEN d.entity_type = 'staff' THEN e.full_name
               WHEN d.entity_type = 'vendor' THEN v.name
               WHEN d.entity_type = 'customer' THEN c.full_name
               ELSE d.title
             END as entity_name
      FROM debts d
      LEFT JOIN employees e ON d.entity_type = 'staff' AND d.entity_id = e.id
      LEFT JOIN vendors v ON d.entity_type = 'vendor' AND d.entity_id = v.id
      LEFT JOIN customers c ON d.entity_type = 'customer' AND d.entity_id = c.id
      WHERE d.created_at BETWEEN ? AND ?
      ORDER BY d.created_at DESC
    `;
    const debtRows: any = await db.query(debtsQuery, [start, end]);
    
    // Group debts into summary
    const debtSummary = {
        receivable: debtRows.filter((d: any) => d.debt_type === 'receivable'),
        payable: debtRows.filter((d: any) => d.debt_type === 'payable'),
        totalReceivable: debtRows.reduce((acc: number, d: any) => d.debt_type === 'receivable' ? acc + (Number(d.total_amount) - Number(d.paid_amount)) : acc, 0),
        totalPayable: debtRows.reduce((acc: number, d: any) => d.debt_type === 'payable' ? acc + (Number(d.total_amount) - Number(d.paid_amount)) : acc, 0)
    };

    // 5. Fetch Raw Transactions for "Buku Besar" (exclude void_reversal — internal entries only)
    const transactionsQuery = `
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN finance_categories c ON t.category_id = c.id
      WHERE t.trx_date BETWEEN ? AND ?
        AND t.status != 'void_reversal'
      ORDER BY t.trx_date DESC, t.id DESC
    `;
    const transactions: any = await db.query(transactionsQuery, [start, end]);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        breakdown: {
          income: incomeBreakdown,
          expense: expenseBreakdown
        },
        trend: trendRows,
        transactions,
        debts: debtSummary
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
