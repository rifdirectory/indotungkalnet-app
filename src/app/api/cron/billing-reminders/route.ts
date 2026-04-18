import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendWhatsApp } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const { mode } = await request.json(); // 'manual' trigger or 'cron'

    // 1. Fetch Suspended Customers who need recovery
    const suspendedQuery = `
      SELECT c.*, p.name as package_name, p.price
      FROM customers c
      LEFT JOIN products p ON c.product_id = p.id
      WHERE c.status = 'suspended'
    `;
    const suspendedRows: any = await db.query(suspendedQuery);

    if (suspendedRows.length === 0) {
      return NextResponse.json({ success: true, message: 'No suspended customers found for recovery.' });
    }

    let successCount = 0;
    let failCount = 0;

    // 2. Process each customer
    for (const customer of suspendedRows) {
      if (!customer.phone_number) continue;

      // Check if they have specific debt records to include amount
      const [debtRow]: any = await db.query(
        'SELECT total_amount, paid_amount FROM debts WHERE entity_id = ? AND entity_type = "customer" AND debt_type = "receivable" AND status = "active" LIMIT 1',
        [customer.id]
      );

      const amountToPay = debtRow ? (Number(debtRow.total_amount) - Number(debtRow.paid_amount)) : customer.price;
      
      const message = `*PEMBERITAHUAN REAKTIVASI LAYANAN* 📶\n\n` +
                      `Halo Bapak/Ibu *${customer.full_name}*,\n` +
                      `Kami mendeteksi layanan internet Anda saat ini sedang dalam status *NON-AKTIF* karena tunggakan pembayaran.\n\n` +
                      `Rincian Tagihan:\n` +
                      `- Paket: ${customer.package_name || customer.package}\n` +
                      `- Jumlah: Rp ${new Intl.NumberFormat('id-ID').format(amountToPay)}\n\n` +
                      `Mohon segera lakukan pembayaran agar layanan internet Anda dapat segera kami aktifkan kembali secara otomatis.\n\n` +
                      `Abaikan pesan ini jika Anda sudah melakukan pembayaran. Terima kasih.\n` +
                      `-- *Indotungkal Net* --`;

      const res = await sendWhatsApp(customer.phone_number, message);
      if (res.success) successCount++;
      else failCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Revenue recovery triggered for ${suspendedRows.length} customers.`,
      stats: { success: successCount, failed: failCount }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
