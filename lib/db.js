const path = require('path');
const bcrypt = require('bcryptjs');
const { SCHOOL_DIRECTORY } = require('./schools');

const isPostgres = Boolean(process.env.DATABASE_URL);
let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  const { Pool } = require('pg');
  const isLocalPostgres = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalPostgres ? false : { rejectUnauthorized: false }
  });
} else {
  // Local SQLite fallback
  const Database = require('better-sqlite3');
  const dbFile = path.join(__dirname, '..', 'data.db');
  sqliteDb = new Database(dbFile);
  sqliteDb.pragma('journal_mode = WAL');
}

/**
 * Normalizes SQL query for SQLite by replacing $1, $2, etc. with ?
 */
function toSqliteQuery(sql) {
  return sql.replace(/\$\d+/g, '?');
}

/**
 * Execute a query returning multiple rows
 */
async function query(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(sql, params);
    return res.rows;
  } else {
    const converted = toSqliteQuery(sql);
    const stmt = sqliteDb.prepare(converted);
    return stmt.all(...params);
  }
}

/**
 * Execute a query returning a single row or null
 */
async function queryOne(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(sql, params);
    return res.rows[0] || null;
  } else {
    const converted = toSqliteQuery(sql);
    const stmt = sqliteDb.prepare(converted);
    const row = stmt.get(...params);
    return row || null;
  }
}

/**
 * Execute an INSERT / UPDATE / DELETE statement
 */
async function execute(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(sql, params);
    return { rowCount: res.rowCount };
  } else {
    const converted = toSqliteQuery(sql);
    const stmt = sqliteDb.prepare(converted);
    const info = stmt.run(...params);
    return { rowCount: info.changes, insertId: info.lastInsertRowid };
  }
}

/**
 * Initialize database schema and initial seed data
 */
async function initDb() {
  const createSchoolsTable = `
    CREATE TABLE IF NOT EXISTS schools (
      udise_code VARCHAR(20) PRIMARY KEY,
      school_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL,
      school_udise VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createTeachersTable = `
    CREATE TABLE IF NOT EXISTS teachers (
      id VARCHAR(50) PRIMARY KEY,
      sl_no VARCHAR(20) NOT NULL,
      udise_code VARCHAR(20) NOT NULL,
      school_name TEXT NOT NULL,
      school_type VARCHAR(50) NOT NULL,
      teacher_name TEXT NOT NULL,
      sex VARCHAR(10) NOT NULL,
      designation VARCHAR(100) NOT NULL,
      qualification VARCHAR(255) NOT NULL,
      main_subject VARCHAR(100) NOT NULL,
      other_subject VARCHAR(100) NOT NULL,
      medium_of_teaching VARCHAR(50) NOT NULL,
      dob VARCHAR(20) NOT NULL,
      date_of_appointment VARCHAR(20) NOT NULL,
      date_of_retirement VARCHAR(20) NOT NULL,
      appointment_nature VARCHAR(50),
      address TEXT NOT NULL,
      area VARCHAR(100) NOT NULL,
      email_id VARCHAR(100) NOT NULL,
      mobile_no VARCHAR(20) NOT NULL,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexTeachers = `
    CREATE INDEX IF NOT EXISTS idx_teachers_udise ON teachers (udise_code);
  `;

  if (isPostgres) {
    await pgPool.query(createSchoolsTable);
    await pgPool.query(createUsersTable);
    await pgPool.query(createTeachersTable);
    await pgPool.query(createIndexTeachers);
  } else {
    sqliteDb.exec(createSchoolsTable);
    sqliteDb.exec(createUsersTable);
    sqliteDb.exec(createTeachersTable);
    sqliteDb.exec(createIndexTeachers);
  }

  // 1. Seed all 138 schools if schools table is empty
  const countRow = await queryOne('SELECT COUNT(*) as count FROM schools');
  const count = parseInt(countRow.count || countRow['count(*)'] || 0, 10);
  if (count === 0) {
    console.log('Seeding 138 schools into database...');
    for (const [code, name] of Object.entries(SCHOOL_DIRECTORY)) {
      await execute(
        'INSERT INTO schools (udise_code, school_name) VALUES ($1, $2)',
        [code, name]
      );
    }
    console.log('Schools seeded successfully.');
  }

  // 2. Seed Default Admin user if not exists
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@DEO2026';
  const adminUser = await queryOne('SELECT id FROM users WHERE username = $1', [adminUsername]);

  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPassword, salt);
    await execute(
      'INSERT INTO users (id, username, password_hash, role, school_udise) VALUES ($1, $2, $3, $4, $5)',
      ['usr_admin_1', adminUsername, hash, 'admin', null]
    );
    console.log(`Default admin account initialized (username: ${adminUsername})`);
  }
}

module.exports = {
  isPostgres,
  query,
  queryOne,
  execute,
  initDb
};

