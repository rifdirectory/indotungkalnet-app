import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendWhatsApp } from '@/lib/whatsapp';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { employee_ids, title, body: message } = body;

        if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
            return NextResponse.json({ success: false, message: 'Harap pilih minimal satu pegawai.' }, { status: 400 });
        }

        if (!message) {
            return NextResponse.json({ success: false, message: 'Isi pesan tidak boleh kosong.' }, { status: 400 });
        }

        // Fetch phone numbers for provided IDs
        const employees: any = await db.query(
            'SELECT id, full_name, phone FROM employees WHERE id IN (?)',
            [employee_ids]
        );

        if (employees.length === 0) {
            return NextResponse.json({ success: false, message: 'Pegawai tidak ditemukan.' }, { status: 404 });
        }

        const results = [];
        let successCount = 0;
        let failCount = 0;

        // Combine title and message for WA if title is provided
        const fullMessage = title ? `*${title}*\n\n${message}` : message;

        for (const emp of employees) {
            if (!emp.phone) {
                results.push({ id: emp.id, name: emp.full_name, success: false, error: 'Nomor telepon tidak terdaftar' });
                failCount++;
                continue;
            }

            const res = await sendWhatsApp(emp.phone, fullMessage);
            if (res.success) {
                successCount++;
                results.push({ id: emp.id, name: emp.full_name, success: true });
            } else {
                failCount++;
                results.push({ id: emp.id, name: emp.full_name, success: false, error: res.message });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Selesai: ${successCount} berhasil, ${failCount} gagal.`,
            details: results
        });
    } catch (error: any) {
        console.error('[Notification API] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
