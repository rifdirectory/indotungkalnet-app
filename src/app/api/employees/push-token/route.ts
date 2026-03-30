import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { employee_id, push_token } = await req.json();

        if (!employee_id || !push_token) {
            return NextResponse.json({ success: false, message: 'Missing employee_id or push_token' }, { status: 400 });
        }

        await query(
            'UPDATE employees SET push_token = ? WHERE id = ?',
            [push_token, employee_id]
        );

        return NextResponse.json({ success: true, message: 'Push token updated successfully' });
    } catch (error: any) {
        console.error('[Push Token] API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
