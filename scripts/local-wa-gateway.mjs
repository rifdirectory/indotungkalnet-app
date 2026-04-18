import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import express from 'express';
import cors from 'cors';

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

let qrCode = '';
let connectionStatus = 'INITIALIZING'; // INITIALIZING, QR_REQUIRED, READY, AUTH_FAILURE

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        handleSIGINT: false,
    }
});

client.on('qr', (qr) => {
    connectionStatus = 'QR_REQUIRED';
    qrcode.toDataURL(qr, (err, url) => {
        qrCode = url;
        console.log('[WA Gateway] QR Code generated. Please scan in Settings page.');
    });
});

client.on('ready', () => {
    connectionStatus = 'READY';
    qrCode = ''; 
    console.log('[WA Gateway] Client is ready!');
});

client.on('authenticated', () => {
    console.log('[WA Gateway] Authenticated successfully');
});

client.on('auth_failure', (msg) => {
    connectionStatus = 'AUTH_FAILURE';
    console.error('[WA Gateway] Auth failure:', msg);
});

client.on('disconnected', (reason) => {
    connectionStatus = 'QR_REQUIRED';
    console.log('[WA Gateway] Client was logged out:', reason);
    client.initialize();
});

// API Endpoints
app.get('/status', (req, res) => {
    res.json({ 
        status: connectionStatus,
        qr: qrCode
    });
});

app.post('/reset', async (req, res) => {
    try {
        console.log('[WA Gateway] Reset requested. Logging out...');
        await client.logout();
        connectionStatus = 'QR_REQUIRED';
        qrCode = '';
        res.json({ success: true, message: 'Gateway reset. QR Code will be generated shortly.' });
    } catch (error) {
        console.error('[WA Gateway] Reset failed:', error);
        // If logout fails, it might already be disconnected
        connectionStatus = 'QR_REQUIRED';
        await client.initialize().catch(() => {});
        res.json({ success: true, message: 'Gateway re-initialized.' });
    }
});

app.get('/qr', (req, res) => {
    if (qrCode) {
        res.send(`<img src="${qrCode}" />`);
    } else {
        res.send('QR Code not available (Already connected or initializing)');
    }
});

app.post('/send', async (req, res) => {
    const { target, message } = req.body;

    if (connectionStatus !== 'READY') {
        console.warn('[WA Gateway] Rejecting send: Status is', connectionStatus);
        return res.status(503).json({ success: false, message: 'Gateway is not ready. Status: ' + connectionStatus });
    }

    if (!target || !message) {
        return res.status(400).json({ success: false, message: 'Missing target or message' });
    }

    try {
        const formattedTarget = target.replace(/[^\d]/g, '');
        const chatId = formattedTarget.includes('@c.us') ? formattedTarget : `${formattedTarget}@c.us`;
        
        await client.sendMessage(chatId, message);
        console.log(`[WA Gateway] Message sent successfully to ${formattedTarget}`);
        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        console.error('[WA Gateway] Send ERROR:', error.message);
        
        // Handle common session errors by attempting recovery
        if (error.message.includes('detached') || error.message.includes('closed') || error.message.includes('Protocol error')) {
            console.log('[WA Gateway] Critical session error detected. Attempting re-initialization...');
            connectionStatus = 'QR_REQUIRED';
            client.initialize().catch(() => {});
        }

        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`[WA Gateway] API running on http://localhost:${port}`);
    client.initialize().catch(err => {
        console.error('[WA Gateway] Initialization failed:', err);
    });
});
