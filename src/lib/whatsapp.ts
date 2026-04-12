import db from './db';

interface WASettings {
    wa_gateway_url: string;
    wa_api_token: string;
    wa_notification_enabled: string;
    wa_gateway_mode: string;
}

async function getWASettings(): Promise<WASettings> {
    const rows = await db.query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN ("wa_gateway_url", "wa_api_token", "wa_notification_enabled", "wa_gateway_mode")');
    const settings: any = {
        wa_gateway_url: 'https://api.fonnte.com/send',
        wa_notification_enabled: '0',
        wa_gateway_mode: 'cloud'
    };
    (rows as any[]).forEach(row => {
        settings[row.setting_key] = row.setting_value;
    });
    return settings;
}

function formatPhoneNumber(phone: string): string {
    // Basic formatting for ID numbers (handles hidden formatting chars)
    let cleaned = phone.replace(/[^\d]/g, '').trim();
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
}

export async function sendWhatsApp(to: string, message: string): Promise<{ success: boolean; message: string; response?: any }> {
    try {
        const settings = await getWASettings();

        if (settings.wa_notification_enabled !== '1') {
            console.log('[WhatsApp] Notifications are disabled in settings.');
            return { success: false, message: 'Notifications disabled' };
        }

        if (settings.wa_gateway_mode === 'cloud' && !settings.wa_api_token) {
            console.error('[WhatsApp] API Token is missing in settings.');
            return { success: false, message: 'API Token missing' };
        }

        const formattedPhone = formatPhoneNumber(to);
        const url = settings.wa_gateway_url;

        console.log(`[WhatsApp] Sending message to ${formattedPhone}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': settings.wa_api_token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: formattedPhone,
                message: message,
                countryCode: '62', // Default for Indonesia
            })
        });

        const data = await response.json();

        if (data.status || data.success) {
            return { success: true, message: 'Message sent successfully', response: data };
        } else {
            console.error('[WhatsApp] Gateway Error:', data);
            return { success: false, message: data.reason || 'Gateway error', response: data };
        }
    } catch (error: any) {
        console.error('[WhatsApp] System Error:', error);
        return { success: false, message: error.message };
    }
}
