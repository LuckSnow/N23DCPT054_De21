import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.SQLITE_DB_PATH || path.join(dbDir, 'cinema.sqlite');
let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    throw new Error('SQLite chưa được kết nối.');
  }
  return dbInstance;
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export async function connectDb() {
  if (dbInstance) return dbInstance;
  await new Promise((resolve, reject) => {
    dbInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      resolve(dbInstance);
    });
  });

  await run('PRAGMA foreign_keys = ON;');

  // Tạo bảng the_loai
  await run(`
    CREATE TABLE IF NOT EXISTS the_loai (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      tenKey TEXT NOT NULL UNIQUE
    );
  `);

  // Tạo bảng phim
  await run(`
    CREATE TABLE IF NOT EXISTS phim (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      tenKey TEXT NOT NULL,
      daoDien TEXT NOT NULL,
      namPhatHanh INTEGER NOT NULL,
      thoiLuong INTEGER NOT NULL,
      gioiHanTuoi TEXT NOT NULL,
      theLoaiId INTEGER NOT NULL,
      FOREIGN KEY (theLoaiId) REFERENCES the_loai(id),
      UNIQUE (tenKey, namPhatHanh)
    );
  `);

  // Tạo bảng danh_gia
  await run(`
    CREATE TABLE IF NOT EXISTS danh_gia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phimId INTEGER NOT NULL,
      nguoiDanhGia TEXT NOT NULL,
      nguoiDanhGiaKey TEXT NOT NULL,
      diem INTEGER NOT NULL,
      binhLuan TEXT NOT NULL,
      ngay TEXT NOT NULL,
      FOREIGN KEY (phimId) REFERENCES phim(id) ON DELETE CASCADE,
      UNIQUE (phimId, nguoiDanhGiaKey)
    );
  `);

  return dbInstance;
}

export async function closeDb() {
  if (dbInstance) {
    await new Promise((resolve, reject) => {
      dbInstance.close((err) => {
        if (err) return reject(err);
        dbInstance = null;
        resolve();
      });
    });
  }
}
