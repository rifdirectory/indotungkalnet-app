const XLSX = require('xlsx');
const workbook = XLSX.readFile('AKUNTASI HARIAN 2026.xlsx');
console.log('Sheets:', workbook.SheetNames);

workbook.SheetNames.forEach(name => {
    const worksheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`\nSheet: ${name}`);
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
});
