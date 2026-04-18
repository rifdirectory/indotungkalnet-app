import XLSX from 'xlsx';

async function preview() {
  try {
    const workbook = XLSX.readFile('AKUNTASI HARIAN 2026.xlsx');
    const sheetName = 'JURNAL';
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.log('Sheet JURNAL not found!');
      return;
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { range: 0 }); // range: 0 includes headers
    console.log('Total Rows:', data.length);
    console.log('--- SAMPLE ROWS (First 5) ---');
    console.table(data.slice(0, 5));
    
    // Get unique codes (COA) to see what we are dealing with
    const codes = [...new Set(data.map((row) => row.CODE))];
    console.log('Found COA codes:', codes);
  } catch (err) {
    console.error(err);
  }
}

preview();
