import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/lib/audit';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { asset_id, user, condition, notes } = body;

        if (!asset_id) {
            return NextResponse.json({ success: false, message: 'Asset ID required' }, { status: 400 });
        }

        // 1. Get Asset Details
        const [assetRow]: any = await db.query('SELECT * FROM fixed_assets WHERE id = ?', [asset_id]);
        const asset = assetRow[0];

        if (!asset) {
            return NextResponse.json({ success: false, message: 'Asset not found' }, { status: 404 });
        }

        if (!asset.inventory_item_id) {
            return NextResponse.json({ success: false, message: 'Asset not linked to inventory. Manual deletion required.' }, { status: 400 });
        }

        // 2. Update Asset Status to 'inactive' or 'returned'
        await db.query('UPDATE fixed_assets SET status = "inactive", notes = ? WHERE id = ?', 
            [`Ditarik pada ${new Date().toLocaleDateString('id-ID')}. Catatan: ${notes || ''}. ${asset.notes || ''}`, asset_id]
        );

        // 3. Return to Inventory
        await db.query('UPDATE inventory_items SET stock = stock + 1 WHERE id = ?', [asset.inventory_item_id]);

        // 4. Log Inventory Transaction (IN)
        const trxDate = new Date().toISOString().split('T')[0];
        await db.query(
            `INSERT INTO inventory_logs (item_id, type, quantity, scenario, notes, user, \`condition\`, serial_number, created_at)
             VALUES (?, 'IN', 1, 'RETURN', ?, ?, ?, ?, ?)`,
            [asset.inventory_item_id, `Penarikan Aset: ${asset.name} (ID: ${asset_id})`, user || 'Admin', condition || 'used', asset.serial_number || null, trxDate]
        );

        // 5. Accounting: No immediate reversal of capitalization recommended (it stays as a loss or stays on books at salvage value), 
        // but for simplicity in this "fully connected" system, we'll let the user handle the financial write-off manually or via depreciation.

        await logActivity(user || 'Admin', 'RETURN', 'FixedAsset', `ASSET-${asset_id}`, { name: asset.name, serial_number: asset.serial_number });

        return NextResponse.json({ success: true, message: 'Barang berhasil ditarik kembali ke gudang' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
