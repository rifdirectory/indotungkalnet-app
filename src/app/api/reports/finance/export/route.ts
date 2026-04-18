import { NextResponse } from 'next/server';
import db from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('periodType') || 'monthly';
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const format = searchParams.get('format') || 'excel'; // excel | json

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
      start = searchParams.get('startDate') || `${year}-01-01`;
      end = searchParams.get('endDate') || `${year}-12-31`;
    }

    const formatCurrency = (val: number) => `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;

    // Fetch all transactions
    const transactions: any = await db.query(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN finance_categories c ON t.category_id = c.id
      WHERE t.trx_date BETWEEN ? AND ?
      ORDER BY t.trx_date ASC, t.id ASC
    `, [start, end]);

    // Fetch summary
    const [summaryRow]: any = await db.query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions WHERE trx_date BETWEEN ? AND ? AND status != 'void'
    `, [start, end]);

    const revenue = Number(summaryRow.revenue) || 0;
    const expense = Number(summaryRow.expense) || 0;
    const netProfit = revenue - expense;

    // Fetch breakdown
    const breakdown: any = await db.query(`
      SELECT c.name as category, c.type, SUM(t.amount) as amount
      FROM transactions t
      JOIN finance_categories c ON t.category_id = c.id
      WHERE t.trx_date BETWEEN ? AND ? AND t.status != 'void'
      GROUP BY c.id, c.name, c.type
      ORDER BY c.type, amount DESC
    `, [start, end]);

    const wb = XLSX.utils.book_new();

    // === SHEET 1: Ringkasan / P&L ===
    const plData = [
      ['LAPORAN KEUANGAN — ITNET INDOTUNGKAL NET'],
      [`Periode: ${start} s/d ${end}`],
      [''],
      ['LAPORAN LABA RUGI', ''],
      [''],
      ['I. PENDAPATAN (REVENUE)', ''],
      ...breakdown.filter((r: any) => r.type === 'income').map((r: any) => [`  ${r.category}`, Number(r.amount)]),
      ['TOTAL PENDAPATAN', revenue],
      [''],
      ['II. BIAYA OPERASIONAL (EXPENSES)', ''],
      ...breakdown.filter((r: any) => r.type === 'expense').map((r: any) => [`  ${r.category}`, Number(r.amount)]),
      ['TOTAL BIAYA', expense],
      [''],
      ['LABA BERSIH (NET PROFIT)', netProfit],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(plData);
    ws1['!cols'] = [{ wch: 45 }, { wch: 20 }];
    // Bold first row
    if (ws1['A1']) ws1['A1'].s = { font: { bold: true, sz: 14 } };
    XLSX.utils.book_append_sheet(wb, ws1, 'Laba Rugi');

    // === SHEET 2: Buku Besar ===
    const bbHeaders = ['Tanggal', 'Kategori', 'Deskripsi / Catatan', 'Masuk (Income)', 'Keluar (Expense)', 'Status'];
    const bbData = transactions.map((t: any) => [
      new Date(t.trx_date).toLocaleDateString('id-ID'),
      t.category_name || '-',
      t.notes || '-',
      t.type === 'income' ? Number(t.amount) : '',
      t.type === 'expense' ? Number(t.amount) : '',
      t.status || 'completed'
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet([bbHeaders, ...bbData]);
    ws2['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Buku Besar');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const fileName = periodType === 'monthly' 
      ? `Laporan-Keuangan-${monthNames[parseInt(month)-1]}-${year}.xlsx`
      : `Laporan-Keuangan-${year}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Export API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
