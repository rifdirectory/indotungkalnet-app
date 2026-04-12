import { query } from './src/lib/db.ts';

async function testConnection() {
    try {
        const results = await query('SELECT 1 + 1 as result');
        console.log('Database Connection Success:', results);
    } catch (error) {
        console.error('Database Connection Failed:', error);
    }
}

testConnection();
