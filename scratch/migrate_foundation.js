const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({ 
    host: 'localhost', 
    port: 3306, 
    user: 'root', 
    password: 'advance', 
    database: 'indotungkal_db' 
  });

  console.log('--- Starting Foundation Migration ---');

  // 1. Mark old wrong accounts as inactive
  // 4-1600 (Revenue), 5-2400 (Expense)
  await pool.query('UPDATE chart_of_accounts SET is_active = 0 WHERE code IN (?, ?)', ['4-1600', '5-2400']);
  console.log('Deactivated 4-1600 and 5-2400');

  // 2. Add New Accounts
  const newAccounts = [
    // Taxes
    ['2-2100', 'Hutang PPN Keluaran', 'liability', 'Kewajiban Jangka Pendek', 'PPN 11% dari pelanggan', 'credit'],
    ['1-3100', 'PPN Masukan (Pajak Dibayar Dimuka)', 'asset', 'Aset Lancar', 'PPh yang dibayar ke vendor', 'debit'],
    ['2-2200', 'Hutang PPh 21/23', 'liability', 'Kewajiban Jangka Pendek', 'Potongan pajak gaji atau jasa', 'credit'],
    // ISP Specific
    ['2-3100', 'Pendapatan Diterima di Muka', 'liability', 'Kewajiban Jangka Pendek', 'Uang langganan dibayar awal', 'credit'],
    ['1-1310', 'Penyisihan Piutang Tak Tertagih', 'asset', 'Aset Lancar', 'Antisipasi kredit macet', 'credit'],
    // Cash/Bank Detail
    ['1-1210', 'Bank 9 Jambi', 'asset', 'Aset Lancar', 'Rekening Gaji/Operasional', 'debit']
  ];

  for (const [code, name, group, type, desc, normal] of newAccounts) {
    await pool.query(
      `INSERT INTO chart_of_accounts (code, name, account_group, account_type, description, normal_balance) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE account_group=VALUES(account_group), account_type=VALUES(account_type), description=VALUES(description), normal_balance=VALUES(normal_balance), is_active=1`,
      [code, name, group, type, desc, normal]
    );
    console.log(`Ensured account ${code}: ${name}`);
  }

  // 3. Re-map Finance Categories for Kasbon
  // Previous Categories:
  // ID 16: Bayar Kasbon Karyawan (income) -> previously 4-1600
  // ID 30: Kasbon Karyawan (expense) -> previously 5-2400
  
  // We point both to 1-1400 (Asset: Piutang Karyawan)
  // Income type for "Bayar Kasbon" is fine in UI because it's a "Cash-In", 
  // but in Journal it will be Credit Asset.
  await pool.query('UPDATE finance_categories SET coa_code = ? WHERE name LIKE ?', ['1-1400', '%Kasbon Karyawan%']);
  console.log('Re-mapped Kasbon categories to 1-1400');

  console.log('--- Migration Complete ---');
  await pool.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
