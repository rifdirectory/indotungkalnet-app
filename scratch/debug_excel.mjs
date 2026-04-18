import XLSX from 'xlsx';

const workbook = XLSX.readFile('AKUNTASI HARIAN 2026.xlsx', { cellDates: true });
const sheet = workbook.Sheets['JURNAL'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Read as array of arrays

console.log(JSON.stringify(data.slice(0, 50), null, 2));
