import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getJakartaNow } from '@/lib/dateUtils';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employee_id');

        if (!employeeId) {
            return NextResponse.json({ success: false, message: 'Employee ID is required' }, { status: 400 });
        }

        const nowStr = getJakartaNow();
        const [jakartaDate] = nowStr.split(' ');

        console.log(`[SHIFT_DEBUG] Request for Employee: ${employeeId}, Date: ${jakartaDate}`);

        // Check for explicit shift for today
        const rows = await query(`
            SELECT s.name as shift_name, s.start_time, s.end_time, s.color
            FROM employee_shifts es
            JOIN shifts s ON es.shift_id = s.id
            WHERE es.employee_id = ? AND es.date = ?
            LIMIT 1
        `, [employeeId, jakartaDate]);

        const shifts = rows as any[];
        
        if (shifts.length > 0) {
            return NextResponse.json({ 
                success: true, 
                data: {
                    name: shifts[0].shift_name,
                    start_time: shifts[0].start_time.substring(0, 5),
                    end_time: shifts[0].end_time.substring(0, 5),
                    color: shifts[0].color,
                    is_custom: true
                }
            });
        }

        // Fallback to a suitable default shift from the database
        const fallbackRows = await query(`
            SELECT name as shift_name, start_time, end_time, color
            FROM shifts
            ORDER BY 
              CASE 
                WHEN name LIKE '%Full%' THEN 0 
                WHEN name LIKE '%Normal Day%' THEN 1
                ELSE 2 
              END ASC
            LIMIT 1
        `);

        const fallbacks = fallbackRows as any[];
        
        if (fallbacks.length > 0) {
            return NextResponse.json({ 
                success: true, 
                data: {
                    name: fallbacks[0].shift_name,
                    start_time: fallbacks[0].start_time.substring(0, 5),
                    end_time: fallbacks[0].end_time.substring(0, 5),
                    color: fallbacks[0].color,
                    is_custom: false
                }
            });
        }

        // Ultimate fallback (should not happen if shifts table has data)
        return NextResponse.json({ 
            success: true, 
            data: {
                name: 'Not Assigned',
                start_time: '--:--',
                end_time: '--:--',
                color: '#8e8e93',
                is_custom: false
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
