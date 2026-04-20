import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
async function run() {
  try {
    const db = await mysql.createConnection(process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indotungkalnet'
    });
    
    // Fetch all employees
    const [employees] = await db.query('SELECT id, full_name, nickname FROM employees');
    
    // Fetch staff debts without entity_id
    const [debts] = await db.query("SELECT id, title FROM debts WHERE entity_type = 'staff' AND entity_id IS NULL");
    console.log(`Found ${debts.length} unlinked staff debts.`);
    
    let matched = 0;
    for (const d of debts) {
      const titleLower = d.title.toLowerCase();
      // Try to find employee by first name or nickname
      let foundId = null;
      for (const e of employees) {
         const names = e.full_name.toLowerCase().split(' ');
         for(const n of names) {
            if(n.length > 2 && titleLower.includes(n)) {
               foundId = e.id; break;
            }
         }
         if(foundId) break;
      }
      
      if (foundId) {
         await db.query("UPDATE debts SET entity_id = ? WHERE id = ?", [foundId, d.id]);
         matched++;
         console.log(`Matched row ${d.id} ('${d.title}') to employee ${foundId}`);
      } else {
         console.log(`Could not definitively match row ${d.id} ('${d.title}') to an employee.`);
      }
    }
    console.log(`Matched ${matched}/${debts.length} rows.`);
    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
