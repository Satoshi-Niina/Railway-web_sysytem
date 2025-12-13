import Database from 'better-sqlite3';

// SQLiteデータベース接続
let db = null;

export function getDb() {
  if (!db) {
    db = new Database('./test.db', { verbose: console.log });
  }
  return db;
}

export function testConnection() {
  try {
    const database = getDb();
    const result = database.prepare('SELECT datetime("now") as current_time').get();
    return result;
  } catch (error) {
    throw error;
  }
}
