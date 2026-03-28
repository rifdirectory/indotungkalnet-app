const XLSX = require('xlsx');
const fs = require('fs');

try {
  const buf = fs.readFileSync('Data Customer.xlsx');
  const wb = XLSX.read(buf, { type: 'buffer' });
  console.log('Sheet Names:', JSON.stringify(wb.SheetNames));
  
  wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Sheet "${name}" Headers:`, JSON.stringify(data[0]));
  });
} catch (error) {
  console.error('Error reading Excel:', error.message);
}
