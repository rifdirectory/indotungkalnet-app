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

        const formattedPhone = formatPhoneNumber(to);
        const url = settings.wa_gateway_url;

        console.log(`[WhatsApp] Sending to ${formattedPhone} (${settings.wa_gateway_mode})...`);

        // Prepare headers
        const headers: any = {
            'Content-Type': 'application/json'
        };
        
        // Only send Authorization header in cloud mode
        if (settings.wa_gateway_mode === 'cloud') {
            if (!settings.wa_api_token) {
                return { success: false, message: 'API Token missing for Cloud Mode' };
            }
            headers['Authorization'] = settings.wa_api_token;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                target: formattedPhone,
                message: message,
                countryCode: '62',
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('[WhatsApp] Gateway responded with error:', response.status, errData);
            return { 
                success: false, 
                message: errData.message || `Gateway returned status ${response.status}`,
                response: errData 
            };
        }

        const data = await response.json();

        if (data.status || data.success) {
            return { success: true, message: 'Message sent successfully', response: data };
        } else {
            console.error('[WhatsApp] Gateway Logic Error:', data);
            return { success: false, message: data.message || data.reason || 'Gateway error', response: data };
        }
    } catch (error: any) {
        console.error('[WhatsApp] Critical System Error:', error);
        return { success: false, message: `System error: ${error.message}` };
    }
}
