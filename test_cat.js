import db from './src/lib/db.js';
(async () => {
   const [cat] = await db.query("SELECT id, name, type FROM transaction_categories");
   console.log(cat);
   process.exit();
})();
