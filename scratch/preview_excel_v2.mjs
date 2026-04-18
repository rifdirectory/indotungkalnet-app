import XLSX from 'xlsx';

function excelDateToJSDate(serial) {
    if(!serial) return null;
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getFullYear();
    const month = String(date_info.getMonth() + 1).padStart(2, '0');
    const day = String(date_info.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function preview() {
  try {
    const workbook = XLSX.readFile('AKUNTASI HARIAN 2026.xlsx');
    const sheetName = 'JURNAL';
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.log('Sheet JURNAL not found!');
      return;
    }

    // Read as raw arrays
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('--- RAW ROWS (First 10) ---');
    rawData.slice(0, 10).forEach((row, idx) => {
        console.log(`Row ${idx}:`, row);
    });

    // Strategy: 
    // Row 1 contains headers: [Tanggal, Keterangan, Debit , Kredit, empty, CODE, Category]
    // Row 2+ contains data
    
    const transactions = [];
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length < 2) continue;
        
        const dateRaw = row[0];
        const desc = row[1];
        const debit = row[2];
        const kredit = row[3];
        const code = row[5];
        const category = row[6];
        
        if (!dateRaw || (!debit && !kredit)) continue;

        transactions.push({
            date: typeof dateRaw === 'number' ? excelDateToJSDate(dateRaw) : dateRaw,
            desc,
            debit,
            kredit,
            code,
            category
        });
    }

    console.log('Total Parsed Transactions:', transactions.length);
    console.log('--- PARSED SAMPLE (First 5) ---');
    console.table(transactions.slice(0, 5));

  } catch (err) {
    console.error(err);
  }
}

preview();
