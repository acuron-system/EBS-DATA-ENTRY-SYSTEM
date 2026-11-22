require('dotenv').config();
const { initDb, isPostgres, queryOne } = require('../lib/db');

async function runSeed() {
  console.log('--- Initializing Database ---');
  console.log('Driver:', isPostgres ? 'PostgreSQL' : 'SQLite');
  try {
    await initDb();
    const count = await queryOne('SELECT COUNT(*) as c FROM schools');
    console.log(`Initialization complete! Total schools in database: ${count.c || count['count(*)']}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

runSeed();

