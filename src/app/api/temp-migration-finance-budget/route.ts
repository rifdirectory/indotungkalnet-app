import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS finance_budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        month INT NOT NULL COMMENT '1-12',
        year INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_budget (category_id, month, year),
        FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE CASCADE
      )
    `);

    return NextResponse.json({ success: true, message: 'Tabel finance_budgets berhasil dibuat.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
