import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import 'dotenv/config';

const path = resolve(process.cwd(), process.env.DATABASE_PATH || './data/phim.sqlite');
mkdirSync(dirname(path), { recursive: true });
export const db = new DatabaseSync(path);
db.exec(`PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS the_loai (id INTEGER PRIMARY KEY AUTOINCREMENT, ten TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS phim (id INTEGER PRIMARY KEY AUTOINCREMENT, ten TEXT NOT NULL, dao_dien TEXT NOT NULL,
 nam_phat_hanh INTEGER NOT NULL, thoi_luong INTEGER NOT NULL, gioi_han_tuoi TEXT NOT NULL,
 the_loai_id INTEGER NOT NULL REFERENCES the_loai(id) ON DELETE RESTRICT,
 UNIQUE(ten, nam_phat_hanh));
CREATE TABLE IF NOT EXISTS danh_gia (id INTEGER PRIMARY KEY AUTOINCREMENT, phim_id INTEGER NOT NULL REFERENCES phim(id) ON DELETE CASCADE,
 nguoi_danh_gia TEXT NOT NULL, diem INTEGER NOT NULL, binh_luan TEXT NOT NULL DEFAULT '',
 ngay TEXT NOT NULL, UNIQUE(phim_id, nguoi_danh_gia));`);
