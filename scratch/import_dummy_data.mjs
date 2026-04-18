import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const poolConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
};

async function main() {
  const connection = await mysql.createConnection(poolConfig);
  console.log('Connected to database.');

  try {
    const [categories] = await connection.query('SELECT * FROM finance_categories');
    const [coas] = await connection.query('SELECT * FROM chart_of_accounts');
    
    const catMap = new Map();
    categories.forEach(c => { if(c.coa_code) catMap.set(c.coa_code, c); });
    
    const accountMap = new Map();
    coas.forEach(c => {
        if(c.account_group === 'asset' || c.account_group === 'liability') {
            accountMap.set(c.code, c.id);
        }
    });

    console.log('Reading Excel file...');
    const workbook = XLSX.readFile('AKUNTASI HARIAN 2026.xlsx', { cellDates: true });
    const sheet = workbook.Sheets['JURNAL'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`Found ${rows.length} rows in JURNAL.`);

    const transactionsToInsert = [];
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 3) continue;

        const date = row[0];
        const notes = row[1];
        const coaCode = row[2];
        const debit = parseFloat(row[5]) || 0;
        const credit = parseFloat(row[6]) || 0;

        if (!coaCode || typeof coaCode !== 'string') continue;

        if (coaCode.startsWith('4-') || coaCode.startsWith('5-')) {
            const nextRow = rows[i + 1];
            if (nextRow && nextRow[2] && typeof nextRow[2] === 'string' && nextRow[2].startsWith('1-')) {
                const category = catMap.get(coaCode);
                const account_id = accountMap.get(nextRow[2]) || 1;
                const amount = debit + credit;

                if (category && amount > 0) {
                    transactionsToInsert.push({
                        trx_date: formatDate(date || getPrevDate(rows, i)),
                        type: coaCode.startsWith('4-') ? 'income' : 'expense',
                        category_id: category.id,
                        account_id: account_id,
                        amount: amount,
                        notes: notes || row[3] || 'Import Excel',
                        reference: `EXCEL-${i}`
                    });
                }
                i++;
            }
        }
    }

    console.log(`Mapped ${transactionsToInsert.length} transactions from Excel.`);

    let successCount = 0;
    for (const trx of transactionsToInsert) {
        try {
            const sql = `INSERT INTO transactions (trx_date, type, category_id, account_id, amount, notes, user, status, reference_number) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            await connection.query(sql, [
                trx.trx_date, trx.type, trx.category_id, trx.account_id, trx.amount, trx.notes, 
                'Admin', 'completed', trx.reference
            ]);
            successCount++;
        } catch (err) {
            if (successCount === 0) console.error('Sample Error:', err.message);
        }
    }

    console.log(`Successfully imported ${successCount} transactions.`);

  } catch (err) {
    console.error('Import Error:', err);
  } finally {
    await connection.end();
  }
}

function formatDate(date) {
    if (!date) return new Date().toISOString().split('T')[0];
    if (date instanceof Date) return date.toISOString().split('T')[0];
    if (typeof date === 'string') {
        const parts = date.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.substring(0, 10);
    }
    if (typeof date === 'number') {
        const d = new Date((date - 25569) * 86400 * 1000);
        return d.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
}

function getPrevDate(rows, index) {
    for (let i = index - 1; i >= 0; i--) {
        if (rows[i] && rows[i][0]) return rows[i][0];
    }
    return null;
}

main();
