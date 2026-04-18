import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
};

function excelDateToJSDate(serial) {
    if(!serial) return null;
    if(typeof serial === 'string') {
        // Handle format like 30/12/2025
        if(serial.includes('/')) {
            const parts = serial.split('/');
            if(parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return serial;
    }
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getFullYear();
    const month = String(date_info.getMonth() + 1).padStart(2, '0');
    const day = String(date_info.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function startImport() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('--- STARTING CONSOLIDATED IMPORT ---');

        // 1. Fetch Mappings
        const [catRows] = await connection.query('SELECT id, coa_code, type FROM finance_categories');
        const [coaRows] = await connection.query('SELECT id, code, account_group, account_type FROM chart_of_accounts');
        
        const categoryMap = {}; // coa_code -> { id, type }
        catRows.forEach(c => { if(c.coa_code) categoryMap[c.coa_code] = { id: c.id, type: c.type }; });

        const accountMap = {}; // code -> id
        coaRows.forEach(c => { 
            if(c.account_group === 'asset' && c.account_type === 'Kas & Bank') {
                accountMap[c.code] = c.id;
            }
        });

        // 2. Read Excel
        const workbook = XLSX.readFile('AKUNTASI HARIAN 2026.xlsx');
        const worksheet = workbook.Sheets['JURNAL'];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const transactions = [];
        let currentEvent = null;

        // Start from row 5 (index 4 is header, data starts at index 5)
        let lastDesc = '';
        let lastDate = '';

        for (let i = 5; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length < 3) continue;

            const date = excelDateToJSDate(row[0]);
            let desc = row[1];
            const code = row[2];
            const debit = Number(row[5]) || 0;
            const kredit = Number(row[6]) || 0;
            const amount = debit || kredit;

            if (!date || amount === 0 || !code) continue;

            // Inheritance logic
            if (!desc && date === lastDate) {
                desc = lastDesc;
            } else if (desc) {
                lastDesc = desc;
                lastDate = date;
            }

            // Only process Jan - March 2026
            if (!date.startsWith('2026-01') && !date.startsWith('2026-02') && !date.startsWith('2026-03') && !date.startsWith('2025')) {
                if (!date.includes('2025')) continue;
            }

            const eventKey = `${date}_${desc}`;
            if (!currentEvent || currentEvent.key !== eventKey) {
                if (currentEvent) transactions.push(currentEvent);
                currentEvent = { key: eventKey, date, desc, rows: [] };
            }
            currentEvent.rows.push({ code, amount, isDebit: debit > 0 });
        }
        if (currentEvent) transactions.push(currentEvent);

        console.log(`Grouped into ${transactions.length} financial events.`);

        // 3. Process Events into Transactions
        let importedCount = 0;
        for (const ev of transactions) {
            // Find Subject (Revenue/Expense) and Account (Kas/Bank)
            const subjectRow = ev.rows.find(r => r.code.startsWith('4-') || r.code.startsWith('5-'));
            const accountRow = ev.rows.find(r => accountMap[r.code]);

            if (subjectRow && accountRow) {
                const catInfo = categoryMap[subjectRow.code];
                const accountId = accountMap[accountRow.code];

                if (catInfo && accountId) {
                    await connection.query(
                        'INSERT INTO transactions (trx_date, type, category_id, amount, status, notes, account_id) VALUES (?, ?, ?, ?, "completed", ?, ?)',
                        [ev.date, catInfo.type, catInfo.id, subjectRow.amount, ev.desc || 'Import from Excel', accountId]
                    );
                    importedCount++;
                    continue;
                }
            }

            // Special Case: Opening Balance / Asset Movement (e.g. 1-xxxx to 3-xxxx)
            const assetRow = ev.rows.find(r => accountMap[r.code]);
            const equityRow = ev.rows.find(r => r.code.startsWith('3-'));
            if (assetRow && equityRow) {
                // Record as Income to that Account (Category mapping doesn't exist for Equity moves usually, use info)
                await connection.query(
                    'INSERT INTO transactions (trx_date, type, category_id, amount, status, notes, account_id) VALUES (?, "income", 11, ?, "completed", ?, ?)',
                    [ev.date, assetRow.amount, `[SALDO AWAL] ${ev.desc || ''}`, accountMap[assetRow.code]]
                );
                importedCount++;
            }
        }

        console.log(`Successfully imported ${importedCount} transactions.`);
        console.log('--- IMPORT COMPLETED ---');

    } catch (err) {
        console.error('Import Error:', err);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

startImport();
