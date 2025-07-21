import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// SQLiteデータベース接続
let db: any = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: './test.db',
      driver: sqlite3.Database
    });
  }
  return db;
}

export async function testConnection() {
  try {
    const database = await getDb();
    const result = await database.get('SELECT datetime("now") as current_time');
    return result;
  } catch (error) {
    throw error;
  }
} 