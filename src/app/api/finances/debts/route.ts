import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // payable or receivable
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = `
      SELECT d.*, 
             CASE 
               WHEN d.entity_type = 'staff' AND e.full_name IS NOT NULL THEN e.full_name
               WHEN d.entity_type = 'vendor' AND v.name IS NOT NULL THEN v.name
               WHEN d.entity_type = 'customer' AND c.full_name IS NOT NULL THEN c.full_name
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

    let rows: any = await db.query(query, params);

    // AUTO MIGRATION: Migrate orphan kasbons from `transactions` to `debts`
    try {
      const orphanRows: any = await db.query(`
        SELECT id, amount, notes, trx_date 
        FROM transactions 
        WHERE (
          category_id = (SELECT id FROM finance_categories WHERE name = 'Kasbon Karyawan' LIMIT 1)
          OR LOWER(notes) LIKE '%kasbon%'
        ) AND debt_id IS NULL AND type = 'expense'
      `);
      if (orphanRows.length > 0) {
        const [kasbonCat]: any = await db.query("SELECT id FROM finance_categories WHERE name = 'Kasbon Karyawan' LIMIT 1");
        const kasbonCatId = kasbonCat?.[0]?.id || null;

        for (let i = 0; i < orphanRows.length; i++) {
          const trx = orphanRows[i];
          const res: any = await db.query(
            "INSERT INTO debts (title, entity_type, debt_type, total_amount, created_at, description) VALUES (?, 'staff', 'receivable', ?, ?, ?)",
            [trx.notes || 'Kasbon Karyawan (Legacy)', trx.amount, trx.trx_date, 'Auto-migrated from legacy transaction']
          );
          
          if (kasbonCatId) {
            await db.query("UPDATE transactions SET debt_id = ?, category_id = ? WHERE id = ?", [res.insertId, kasbonCatId, trx.id]);
          } else {
            await db.query("UPDATE transactions SET debt_id = ? WHERE id = ?", [res.insertId, trx.id]);
          }
        }
        // re-fetch after migration
        rows = await db.query(query, params);
      }

      // SECONDARY FIX: Map migrated debts that have no entity_id to the correct employee by name
      const unlinkedDebts: any = await db.query("SELECT id, title FROM debts WHERE entity_type = 'staff' AND entity_id IS NULL");
      if (unlinkedDebts.length > 0) {
        const [employees]: any = await db.query("SELECT id, full_name FROM employees");
        let updated = false;
        
        for (const d of unlinkedDebts) {
          const titleLower = d.title.toLowerCase();
          let foundId = null;
          
          if (employees) {
            for (const e of employees) {
              const names = e.full_name.toLowerCase().split(' ');
              for(const n of names) {
                if(n.length > 2 && titleLower.includes(n)) {
                   foundId = e.id; break;
                }
              }
              if (foundId) break;
            }
          }
          
          if (foundId) {
             await db.query("UPDATE debts SET entity_id = ? WHERE id = ?", [foundId, d.id]);
             updated = true;
          }
        }
        
        if (updated) rows = await db.query(query, params);
      }

    } catch (e) {
      console.error('Migration error:', e);
    }

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
      
      // Lookup category ids dynamically instead of hardcoding
      const [kasbonCat]: any = await db.query("SELECT id FROM finance_categories WHERE name = 'Kasbon Karyawan' LIMIT 1");
      const [otherCat]: any = await db.query("SELECT id FROM finance_categories WHERE name = 'Biaya Lainnya' LIMIT 1");
      
      let trxCategoryId = debt_type === 'payable' ? 1 : (otherCat?.[0] ? otherCat[0].id : 22);
      if (entity_type === 'staff' && debt_type === 'receivable') {
        trxCategoryId = kasbonCat?.[0] ? kasbonCat[0].id : 30;
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
