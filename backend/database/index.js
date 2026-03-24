const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Database = require('better-sqlite3');
const db = new Database(process.env.DATABASE_PATH || path.join(__dirname, '../database/solvedge.db'));

// Initialize Database
const initDB = require('./init');
initDB(db);

module.exports = db;
