import { NextResponse } from "next/server";
import db from "@/lib/db";
import * as XLSX from 'xlsx';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        let query = `
            SELECT t.*, c.name as category_name
            FROM transactions t
            LEFT JOIN finance_categories c ON t.category_id = c.id
            WHERE t.status != 'void_reversal'
        `;
        // FIX [K-4b]: Exclude void_reversal (internal counter-entries) from exported data
        const params: any[] = [];
        if (start) {
            query += " AND t.trx_date >= ?";
            params.push(start);
        }
        if (end) {
            query += " AND t.trx_date <= ?";
            params.push(end);
        }
        query += " ORDER BY t.trx_date ASC, t.id ASC";

        const rows: any = await db.query(query, params);

        const sheetData = rows.map((r: any) => ({
            'No. Voucher': r.voucher_number || `TRX-${r.id}`,
            'Tanggal': new Date(r.trx_date).toLocaleDateString('id-ID'),
            'Kategori': r.category_name || '-',
            'Tipe': r.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            'Jumlah (Rp)': Number(r.amount),
            'Keterangan': r.notes || '-',   // FIX: was r.description (wrong field)
            'Pencatat': r.user || 'Admin',
            'Status': r.status === 'void' ? 'VOID' : 'Valid',
            'No. Referensi': r.ref_number || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Finance Report');

        // Generate buffer
        const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const filename = `Finance_Report_${start || 'all'}_to_${end || 'today'}.xlsx`;

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('[Finance Export] API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
