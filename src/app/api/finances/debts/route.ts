import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const type = searchParams.get('type'); // payable or receivable
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = `
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
      WHERE 1=1
    `;
    
    const params = [];
    if (type) {
      query += ' AND d.debt_type = ?';
      params.push(type);
    }

    if (startDate) {
      query += ' AND DATE(d.created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(d.created_at) <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY d.created_at DESC';

    const rows = await db.query(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      title, 
      entity_type, 
      entity_id, 
      debt_type, 
      total_amount, 
      due_date, 
      description,
      create_transaction // Boolean: whether to create initial cash movement
    } = body;

    if (!title || !entity_type || !debt_type || !total_amount) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create debt record
    const result: any = await db.query(
      `INSERT INTO debts (title, entity_type, entity_id, debt_type, total_amount, due_date, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, entity_type, entity_id || null, debt_type, total_amount, due_date || null, description || null]
    );

    const debtId = result.insertId;

    // 2. Optional initial transaction
    if (create_transaction) {
      const trxType = debt_type === 'payable' ? 'income' : 'expense';
      
      // Mapping:
      // - Staff Receivable (Kasbon Original) = 30 (Kasbon Karyawan)
      // - Payable = 1 (General Income/Modal fallback)
      let trxCategoryId = debt_type === 'payable' ? 1 : 22; // 22 is Biaya Lainnya fallback
      if (entity_type === 'staff' && debt_type === 'receivable') {
        trxCategoryId = 30;
      }
      
      await db.query(
        `INSERT INTO transactions (trx_date, type, category_id, amount, status, debt_id, notes) 
         VALUES (CURDATE(), ?, ?, ?, 'completed', ?, ?)`,
        [trxType, trxCategoryId, total_amount, debtId, title]
      );
    }

    return NextResponse.json({ success: true, data: { id: debtId } });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
