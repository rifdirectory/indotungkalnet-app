import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        // Create table if not exists (Lazy Migration)
        await db.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                setting_key VARCHAR(50) UNIQUE NOT NULL,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Get office coordinates & WA settings
        const rows = await db.query('SELECT * FROM settings WHERE setting_key IN ("office_latitude", "office_longitude", "office_radius", "wa_gateway_url", "wa_api_token", "wa_notification_enabled", "wa_gateway_mode")');
        const settings: any = {
            wa_gateway_url: 'https://api.fonnte.com/send', // Default
            wa_notification_enabled: '0',
            wa_gateway_mode: 'cloud' // cloud or local
        };
        (rows as any[]).forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        return NextResponse.json({ success: true, data: settings });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { 
            office_latitude, office_longitude, office_radius,
            wa_gateway_url, wa_api_token, wa_notification_enabled,
            wa_gateway_mode
        } = await req.json();
        
        const updates = [
            { key: 'office_latitude', value: office_latitude },
            { key: 'office_longitude', value: office_longitude },
            { key: 'office_radius', value: office_radius },
            { key: 'wa_gateway_url', value: wa_gateway_url },
            { key: 'wa_api_token', value: wa_api_token },
            { key: 'wa_notification_enabled', value: wa_notification_enabled },
            { key: 'wa_gateway_mode', value: wa_gateway_mode }
        ];

        for (const item of updates) {
            await db.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [item.key, item.value?.toString(), item.value?.toString()]
            );
        }

        return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
