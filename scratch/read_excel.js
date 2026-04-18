const XLSX = require('xlsx');
const path = require('path');

const workbook = XLSX.readFile('AKUNTASI HARIAN 2026.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(JSON.stringify(data.slice(0, 10), null, 2));
