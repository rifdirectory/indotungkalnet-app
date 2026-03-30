const { query } = require('/Users/rifdirectory/app/project/indotungkalnet/src/lib/db');
async function run() {
  try {
    await query('ALTER TABLE employees ADD COLUMN push_token VARCHAR(255) NULL AFTER status');
    console.log('Migration Complete: added push_token column to employees');
  } catch (error) {
    if (error.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Column push_token already exists.');
    } else {
      console.error('Migration Failed:', error);
      process.exit(1);
    }
  }
  process.exit(0);
}
run();
