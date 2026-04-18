import XLSX from 'xlsx';

async function debug() {
    const workbook = XLSX.readFile('AKUNTASI HARIAN 2026.xlsx');
    const worksheet = workbook.Sheets['JURNAL'];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Total Raw Rows:', rawData.length);
    for (let i = 0; i < 15; i++) {
        console.log(`Row ${i}:`, rawData[i]);
    }
}

debug();
