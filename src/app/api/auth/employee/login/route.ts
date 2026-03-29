import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { employee_code, password } = await req.json();

        if (!employee_code || !password) {
            return NextResponse.json({ success: false, message: 'ID Pegawai & Kata Sandi wajib diisi' }, { status: 400 });
        }

        // Search employee by code
        const rows = await db.query(
            `SELECT e.*, p.name as position_name, p.use_presence 
             FROM employees e
             LEFT JOIN positions p ON e.position_id = p.id
             WHERE e.employee_code = ?`,
            [employee_code]
        );

        const employees = rows as any[];
        
        if (employees.length === 0) {
            return NextResponse.json({ success: false, message: 'ID Pegawai tidak ditemukan' }, { status: 404 });
        }

        const employee = employees[0];

        // Verify password
        const isPasswordMatch = await bcrypt.compare(password, employee.password || '');
        if (!isPasswordMatch) {
            return NextResponse.json({ success: false, message: 'Kata Sandi salah' }, { status: 401 });
        }

        if (employee.status !== 'active') {
            return NextResponse.json({ success: false, message: 'Akun Anda sudah tidak aktif' }, { status: 403 });
        }

        // Check if employee is a PIC
        const picCheck = await db.query(
            `SELECT COUNT(*) as count FROM positions WHERE pic_id = ?`,
            [employee.id]
        ) as any[];
        const isPic = picCheck[0].count > 0;

        // Create JWT token
        const token = await encrypt({
            userId: employee.id,
            employee_code: employee.employee_code,
            full_name: employee.full_name,
            role: 'employee',
            position: employee.position_name,
            is_pic: isPic
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Login berhasil',
            token,
            data: {
                id: employee.id,
                employee_code: employee.employee_code,
                full_name: employee.full_name,
                position: employee.position_name,
                is_pic: isPic
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
