import { NextResponse } from 'next/server';
import path from 'path';
import * as XLSX from 'xlsx';
import fs from 'fs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'logistik.xlsx');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, message: 'File not found' });
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Return sample and headers
    const headers = data.length > 0 ? Object.keys(data[0] as object) : [];
    const sample = data.slice(0, 5);
    
    return NextResponse.json({ 
      success: true, 
      headers, 
      sample,
      total: data.length
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
