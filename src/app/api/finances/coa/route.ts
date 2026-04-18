import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.query('SELECT * FROM chart_of_accounts ORDER BY code ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, account_group, account_type, description, normal_balance } = body;

    if (!code || !name || !account_group || !normal_balance) {
      return NextResponse.json({ success: false, message: 'Kode, nama, grup, dan saldo normal wajib diisi.' }, { status: 400 });
    }

    // Check duplicate code
    const existing: any = await db.query('SELECT id FROM chart_of_accounts WHERE code = ?', [code]);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: `Kode akun "${code}" sudah digunakan.` }, { status: 400 });
    }

    await db.query(
      `INSERT INTO chart_of_accounts (code, name, account_group, account_type, description, normal_balance)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, account_group, account_type || null, description || null, normal_balance]
    );

    // If revenue or expense, also add to finance_categories
    if (account_group === 'revenue') {
      await db.query(
        `INSERT INTO finance_categories (name, type, coa_code, is_system) VALUES (?, 'income', ?, 1)`,
        [name, code]
      );
    } else if (account_group === 'expense') {
      await db.query(
        `INSERT INTO finance_categories (name, type, coa_code, is_system) VALUES (?, 'expense', ?, 1)`,
        [name, code]
      );
    }

    return NextResponse.json({ success: true, message: 'Akun berhasil ditambahkan.' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, code, name, account_group, account_type, description, normal_balance, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID akun wajib diisi.' }, { status: 400 });
    }

    // Get old code for syncing finance_categories
    const [oldRow]: any = await db.query('SELECT code, account_group FROM chart_of_accounts WHERE id = ?', [id]);

    await db.query(
      `UPDATE chart_of_accounts SET code=?, name=?, account_group=?, account_type=?, description=?, normal_balance=?, is_active=? WHERE id=?`,
      [code, name, account_group, account_type || null, description || null, normal_balance, is_active ?? 1, id]
    );

    // Sync finance_categories
    if (oldRow) {
      await db.query('UPDATE finance_categories SET name=?, coa_code=? WHERE coa_code=?', [name, code, oldRow.code]);
    }

    return NextResponse.json({ success: true, message: 'Akun berhasil diperbarui.' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
