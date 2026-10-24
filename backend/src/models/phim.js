import { db } from './db.js';

const select = `SELECT p.id, p.ten, p.dao_dien AS daoDien, p.nam_phat_hanh AS namPhatHanh,
 p.thoi_luong AS thoiLuong, p.gioi_han_tuoi AS gioiHanTuoi, p.the_loai_id AS theLoaiId,
 t.ten AS tenTheLoai, ROUND(AVG(d.diem), 1) AS diemTrungBinh, COUNT(d.id) AS soDanhGia
 FROM phim p JOIN the_loai t ON t.id=p.the_loai_id LEFT JOIN danh_gia d ON d.phim_id=p.id
 GROUP BY p.id`;

export function one(id) {
  const movie = db.prepare(`SELECT * FROM (${select}) WHERE id=?`).get(id);
  if (!movie) return null;
  movie.theLoai = { id: movie.theLoaiId, ten: movie.tenTheLoai };
  movie.danhGia = db.prepare(`SELECT id, nguoi_danh_gia AS nguoiDanhGia, diem, binh_luan AS binhLuan, ngay
    FROM danh_gia WHERE phim_id=? ORDER BY ngay DESC, id DESC`).all(id);
  return movie;
}
export function list(filters) {
  const clauses = [], params = [];
  if (filters.q) { clauses.push('(LOWER(ten) LIKE ? OR LOWER(daoDien) LIKE ?)'); params.push(`%${filters.q.toLowerCase()}%`, `%${filters.q.toLowerCase()}%`); }
  for (const [key, value] of [['theLoaiId', filters.theLoaiId], ['namPhatHanh', filters.namPhatHanh], ['gioiHanTuoi', filters.gioiHanTuoi]]) {
    if (value !== undefined) { clauses.push(`${key}=?`); params.push(value); }
  }
  if (filters.diemMin !== undefined) { clauses.push('diemTrungBinh>=?'); params.push(filters.diemMin); }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS count FROM (${select})${where}`).get(...params).count;
  const sort = filters.sort || 'id', order = filters.order || 'desc';
  const data = db.prepare(`SELECT * FROM (${select})${where} ORDER BY ${sort} ${order}, id ASC LIMIT ? OFFSET ?`)
    .all(...params, filters.limit, (filters.page - 1) * filters.limit);
  return { data, page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) };
}
export function stats() {
  return {
    theoTheLoai: db.prepare(`SELECT t.id AS theLoaiId, t.ten AS tenTheLoai, ROUND(AVG(d.diem),1) AS diemTrungBinh,
      COUNT(DISTINCT p.id) AS soPhim, COUNT(d.id) AS soDanhGia FROM the_loai t
      LEFT JOIN phim p ON p.the_loai_id=t.id LEFT JOIN danh_gia d ON d.phim_id=p.id GROUP BY t.id ORDER BY t.id`).all(),
    top5: db.prepare(`SELECT * FROM (${select}) WHERE soDanhGia>=3 ORDER BY diemTrungBinh DESC, soDanhGia DESC, id ASC LIMIT 5`).all()
  };
}
