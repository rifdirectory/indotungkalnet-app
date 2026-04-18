import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. Create chart_of_accounts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        account_group ENUM('asset','liability','equity','revenue','expense') NOT NULL,
        account_type VARCHAR(50),
        description TEXT,
        normal_balance ENUM('debit','credit') NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Seed COA from Excel
    const coa = [
      // ASET (1-xxxx)
      ['1-1100', 'Kas', 'asset', 'Aset Lancar', 'Setiap transaksi wajib di-input kas', 'debit'],
      ['1-1200', 'Modal Bank', 'asset', 'Aset Lancar', '', 'debit'],
      ['1-1300', 'Piutang Usaha', 'asset', 'Aset Lancar', '', 'debit'],
      ['1-1400', 'Piutang Karyawan', 'asset', 'Aset Lancar', 'Kasbon/pinjaman dari kas kantor', 'debit'],
      ['1-1500', 'Perlengkapan Kantor', 'asset', 'Aset Lancar', 'Barang operasional yang berharga', 'debit'],
      ['1-1600', 'Sewa Di Bayar Di Muka', 'asset', 'Aset Lancar', 'Pembayaran sewa 1 tahun', 'debit'],
      ['1-2100', 'Tanah', 'asset', 'Aset Tetap', '', 'debit'],
      ['1-2200', 'Peralatan Aset', 'asset', 'Aset Tetap', 'Barang operasional yang dapat dijual', 'debit'],
      ['1-2300', 'Akum. Penyusutan Peralatan', 'asset', 'Aset Tetap', '', 'credit'],
      // KEWAJIBAN (2-xxxx)
      ['2-1100', 'Utang Usaha', 'liability', 'Kewajiban', '', 'credit'],
      ['2-1200', 'Utang Bank', 'liability', 'Kewajiban', '', 'credit'],
      ['2-1300', 'Utang Karyawan', 'liability', 'Kewajiban', 'Kasbon/meminjam kas kantor', 'credit'],
      // MODAL (3-xxxx)
      ['3-1100', 'Modal', 'equity', 'Modal', '', 'credit'],
      ['3-1200', 'Prive', 'equity', 'Modal', 'Pembayaran bank/pribadi', 'debit'],
      ['3-1300', 'Laba Berjalan', 'equity', 'Modal', '', 'credit'],
      // PENDAPATAN (4-xxxx)
      ['4-1100', 'Pendapatan Retail ITNET', 'revenue', 'Pendapatan Usaha', 'Pelanggan kantor, voucher, instalasi', 'credit'],
      ['4-1200', 'Pendapatan Retail Operator', 'revenue', 'Pendapatan Usaha', 'Pembayaran operator', 'credit'],
      ['4-1300', 'Pendapatan Reseller', 'revenue', 'Pendapatan Usaha', 'Pembayaran reseller/mitra', 'credit'],
      ['4-1400', 'Pendapatan Instansi', 'revenue', 'Pendapatan Usaha', 'Pembayaran instansi/perkantoran', 'credit'],
      ['4-1500', 'Pendapatan Logistik', 'revenue', 'Pendapatan Usaha', 'Penjualan logistik', 'credit'],
      ['4-1600', 'Bayar Kasbon Karyawan', 'revenue', 'Pendapatan Usaha', 'Pengembalian kasbon', 'credit'],
      // BEBAN (5-xxxx)
      ['5-1100', 'Gaji', 'expense', 'Beban Usaha', 'Gaji, THR karyawan', 'debit'],
      ['5-1200', 'Peralatan Bahan Habis Pakai', 'expense', 'Beban Usaha', 'Perlengkapan sekali pakai', 'debit'],
      ['5-1300', 'BBM dan Listrik', 'expense', 'Beban Usaha', 'BBM & pembayaran listrik', 'debit'],
      ['5-1400', 'Biaya Sewa', 'expense', 'Beban Usaha', 'Sewa pop OLT, STB, Canva, IP, kantor', 'debit'],
      ['5-1500', 'Biaya Konsumsi', 'expense', 'Beban Usaha', 'Konsumsi harian/operasional', 'debit'],
      ['5-1600', 'Biaya Lainnya', 'expense', 'Beban Usaha', 'BPJS, pajak, perapian kabel', 'debit'],
      ['5-1700', 'Biaya Interkoneksi', 'expense', 'Beban Usaha', 'IP Transit (PGN/Moratel)', 'debit'],
      ['5-1800', 'Beban Akum. Penyusutan', 'expense', 'Beban Usaha', '', 'debit'],
      ['5-1900', 'Biaya SPJ', 'expense', 'Beban Usaha', 'Surat Perintah Jalan', 'debit'],
      ['5-2000', 'Biaya Marketing/Promo', 'expense', 'Beban Usaha', 'Fee, sponsor, program promo', 'debit'],
      ['5-2100', 'Biaya Kegiatan', 'expense', 'Beban Usaha', 'Buka bersama, kurban, syukuran', 'debit'],
      ['5-2200', 'Biaya Pembelian Logistik', 'expense', 'Beban Usaha', 'Pembelian alat logistik', 'debit'],
      ['5-2300', 'Biaya Bangunan', 'expense', 'Beban Usaha', 'Pembangunan/kebutuhan kantor', 'debit'],
      ['5-2400', 'Kasbon Karyawan', 'expense', 'Beban Usaha', 'Kasbon keluar', 'debit'],
    ];

    for (const [code, name, group, type, desc, normal] of coa) {
      await db.query(
        `INSERT INTO chart_of_accounts (code, name, account_group, account_type, description, normal_balance)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), account_group = VALUES(account_group), 
         account_type = VALUES(account_type), description = VALUES(description), normal_balance = VALUES(normal_balance)`,
        [code, name, group, type, desc, normal]
      );
    }

    // 3. Sync finance_categories to match COA revenue + expense accounts
    // Add coa_code column if not exists
    try {
      await db.query(`ALTER TABLE finance_categories ADD COLUMN coa_code VARCHAR(10) DEFAULT NULL`);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column')) throw e;
    }

    // Clear old categories and re-seed from COA
    await db.query('DELETE FROM finance_categories WHERE id NOT IN (SELECT DISTINCT category_id FROM transactions WHERE category_id IS NOT NULL)');
    
    // Insert revenue categories
    const revenueAccounts = coa.filter(c => c[2] === 'revenue');
    for (const [code, name] of revenueAccounts) {
      await db.query(
        `INSERT INTO finance_categories (name, type, coa_code, is_system)
         VALUES (?, 'income', ?, 1)
         ON DUPLICATE KEY UPDATE coa_code = VALUES(coa_code)`,
        [name, code]
      );
    }

    // Insert expense categories
    const expenseAccounts = coa.filter(c => c[2] === 'expense');
    for (const [code, name] of expenseAccounts) {
      await db.query(
        `INSERT INTO finance_categories (name, type, coa_code, is_system)
         VALUES (?, 'expense', ?, 1)
         ON DUPLICATE KEY UPDATE coa_code = VALUES(coa_code)`,
        [name, code]
      );
    }

    // Verify
    const coaCount: any = await db.query('SELECT COUNT(*) as cnt FROM chart_of_accounts');
    const catCount: any = await db.query('SELECT COUNT(*) as cnt FROM finance_categories');
    const cats: any = await db.query('SELECT id, name, type, coa_code FROM finance_categories ORDER BY type, name');

    return NextResponse.json({
      success: true,
      message: 'COA migrated successfully',
      data: {
        chart_of_accounts: coaCount[0].cnt,
        finance_categories: catCount[0].cnt,
        categories: cats
      }
    });
  } catch (error: any) {
    console.error('Migration Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
