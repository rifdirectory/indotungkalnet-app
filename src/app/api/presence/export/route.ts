import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import * as XLSX from 'xlsx';

// Helper for total minutes from midnight Jakarta
const getJakartaMinutes = (date: Date) => {
    const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric', minute: 'numeric', hour12: false
    }).format(date);
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Jakarta', 
        year: 'numeric', month: '2-digit', day: '2-digit' 
    }).format(date);
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        const mode = searchParams.get('mode') || 'log';

        if (!start || !end) {
            return NextResponse.json({ success: false, message: 'Range tanggal diperlukan' }, { status: 400 });
        }

        let sheetData: any[] = [];
        let filename = `Presence_${start}_to_${end}.xlsx`;

        if (mode === 'grid') {
            // Matrix View logic
            const history = (await query(`
                SELECT e.id as employee_id, e.full_name as employee_name, p.name as position_name,
                       a.type, a.status, a.timestamp,
                       s.start_time as shift_start, s.end_time as shift_end
                FROM employees e
                LEFT JOIN positions p ON e.position_id = p.id
                LEFT JOIN attendance a ON (e.id = a.employee_id AND DATE(a.timestamp) BETWEEN ? AND ?)
                LEFT JOIN employee_shifts es ON (e.id = es.employee_id AND DATE(a.timestamp) = es.date)
                LEFT JOIN shifts s ON es.shift_id = s.id
                WHERE e.status = 'active'
                ORDER BY e.full_name ASC, a.timestamp ASC
            `, [start, end])) as any[];

            const leaves = (await query(`
                SELECT employee_id, type, start_date, end_date FROM leave_requests WHERE status = 'approved'
            `)) as any[];

            const employees: any = {};
            const days: string[] = [];
            let curr = new Date(start);
            const endDate = new Date(end);
            while (curr <= endDate) {
                days.push(formatDate(curr));
                curr.setDate(curr.getDate() + 1);
            }

            history.forEach(log => {
                if (!employees[log.employee_id]) {
                    employees[log.employee_id] = { Nama: log.employee_name, Jabatan: log.position_name };
                    days.forEach(d => employees[log.employee_id][d] = '-');
                }
                const dStr = formatDate(new Date(log.timestamp));
                if (log.type === 'clock_in') {
                    const time = new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    employees[log.employee_id][dStr] = `${time}${log.status === 'late' ? ' (T)' : ''}`;
                }
            });

            // Map leaves
            leaves.forEach(l => {
                if (employees[l.employee_id]) {
                    days.forEach(d => {
                        if (d >= formatDate(new Date(l.start_date)) && d <= formatDate(new Date(l.end_date))) {
                            employees[l.employee_id][d] = l.type.toUpperCase();
                        }
                    });
                }
            });

            sheetData = Object.values(employees);
            filename = `Presence_Grid_${start}_to_${end}.xlsx`;

        } else if (mode === 'summary') {
            // Aggregate View logic
            const stats = (await query(`
                SELECT 
                    e.full_name as Nama, p.name as Jabatan,
                    COUNT(DISTINCT DATE(a.timestamp)) as Total_Hari_Masuk,
                    SUM(CASE WHEN a.type = 'clock_in' AND a.status = 'on_time' THEN 1 ELSE 0 END) as Tepat_Waktu,
                    SUM(CASE WHEN a.type = 'clock_in' AND a.status = 'late' THEN 1 ELSE 0 END) as Terlambat
                FROM employees e
                LEFT JOIN positions p ON e.position_id = p.id
                LEFT JOIN attendance a ON (e.id = a.employee_id AND DATE(a.timestamp) BETWEEN ? AND ?)
                WHERE e.status = 'active'
                GROUP BY e.id
                ORDER BY e.full_name ASC
            `, [start, end])) as any[];

            sheetData = stats.map(s => ({
                ...s,
                Persentase: s.Total_Hari_Masuk > 0 ? `${Math.round((s.Tepat_Waktu / s.Total_Hari_Masuk) * 100)}%` : '0%'
            }));
            filename = `Presence_Summary_${start}_to_${end}.xlsx`;

        } else {
            // Log View logic (Default)
            sheetData = (await query(`
                SELECT 
                    a.timestamp as Waktu, e.full_name as Nama, p.name as Jabatan, 
                    a.type as Tipe, a.status as Status, a.note as Catatan
                FROM attendance a
                JOIN employees e ON a.employee_id = e.id
                LEFT JOIN positions p ON e.position_id = p.id
                WHERE DATE(a.timestamp) BETWEEN ? AND ?
                ORDER BY a.timestamp DESC
            `, [start, end])) as any[];

            sheetData = sheetData.map(log => ({
                Waktu: new Date(log.Waktu).toLocaleString('id-ID'),
                Nama: log.Nama,
                Jabatan: log.Jabatan,
                Tipe: log.Tipe === 'clock_in' ? 'Masuk' : 'Pulang',
                Status: log.Status === 'late' ? 'Terlambat' : 'Tepat Waktu',
                Catatan: log.Catatan || '-'
            }));
            filename = `Presence_Logs_${start}_to_${end}.xlsx`;
        }

        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Presence Report');

        // Generate buffer
        const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('[Export] API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
