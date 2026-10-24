import { all, get, run } from '../models/db.js';
import * as phim from '../models/phim.js';
import { HttpError } from '../middlewares/common.js';

const fail = (status, message, details = []) => { throw new HttpError(status, message, details); };
const positiveId = value => {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail(400, 'ID không hợp lệ.');
  return n;
};
const trim = value => typeof value === 'string' ? value.trim() : '';
const integer = value => typeof value === 'number' && Number.isInteger(value);
const key = value => value.toLocaleLowerCase('vi');

export async function listGenres(req, res) {
  const genres = await all(`SELECT id, ten FROM the_loai ORDER BY ten ASC`);
  res.json(genres);
}

export async function createGenre(req, res) {
  const ten = trim(req.body?.ten);
  if (!ten) fail(400, 'Dữ liệu không hợp lệ.', [{ field: 'ten', message: 'Tên thể loại là bắt buộc.' }]);
  
  const existing = await get(`SELECT id FROM the_loai WHERE tenKey = ?`, [key(ten)]);
  if (existing) fail(409, 'Thể loại đã tồn tại.', [{ field: 'ten', message: 'Tên thể loại không được trùng.' }]);

  const result = await run(`INSERT INTO the_loai (ten, tenKey) VALUES (?, ?)`, [ten, key(ten)]);
  res.status(201).json({ id: result.lastID, ten });
}

export async function updateGenre(req, res) {
  const id = positiveId(req.params.id);
  const ten = trim(req.body?.ten);

  const existing = await get(`SELECT id FROM the_loai WHERE id = ?`, [id]);
  if (!existing) fail(404, 'Không tìm thấy thể loại.');
  if (!ten) fail(400, 'Dữ liệu không hợp lệ.', [{ field: 'ten', message: 'Tên thể loại là bắt buộc.' }]);

  const duplicate = await get(`SELECT id FROM the_loai WHERE tenKey = ? AND id != ?`, [key(ten), id]);
  if (duplicate) fail(409, 'Thể loại đã tồn tại.', [{ field: 'ten', message: 'Tên thể loại không được trùng.' }]);

  await run(`UPDATE the_loai SET ten = ?, tenKey = ? WHERE id = ?`, [ten, key(ten), id]);
  res.json({ id, ten });
}

export async function deleteGenre(req, res) {
  const id = positiveId(req.params.id);
  const existing = await get(`SELECT id FROM the_loai WHERE id = ?`, [id]);
  if (!existing) fail(404, 'Không tìm thấy thể loại.');

  const hasMovie = await get(`SELECT id FROM phim WHERE theLoaiId = ? LIMIT 1`, [id]);
  if (hasMovie) fail(409, 'Thể loại đang có phim, không thể xóa.');

  await run(`DELETE FROM the_loai WHERE id = ?`, [id]);
  res.json({ message: 'Đã xóa thể loại.' });
}

async function movieData(body) {
  const data = {
    ten: trim(body.ten),
    daoDien: trim(body.daoDien),
    namPhatHanh: body.namPhatHanh,
    thoiLuong: body.thoiLuong,
    gioiHanTuoi: body.gioiHanTuoi,
    theLoaiId: body.theLoaiId
  };
  const details = [];
  if (!data.ten) details.push({ field: 'ten', message: 'Tên phim là bắt buộc.' });
  if (!data.daoDien) details.push({ field: 'daoDien', message: 'Đạo diễn là bắt buộc.' });
  if (!integer(data.namPhatHanh) || data.namPhatHanh < 1950 || data.namPhatHanh > new Date().getFullYear() + 1) {
    details.push({ field: 'namPhatHanh', message: 'Năm phát hành không hợp lệ.' });
  }
  if (!integer(data.thoiLuong) || data.thoiLuong < 30 || data.thoiLuong > 300) {
    details.push({ field: 'thoiLuong', message: 'Thời lượng phải từ 30 đến 300 phút.' });
  }
  if (!['P', 'T13', 'T16', 'T18'].includes(data.gioiHanTuoi)) {
    details.push({ field: 'gioiHanTuoi', message: 'Giới hạn tuổi không hợp lệ.' });
  }
  
  const genreExists = await get(`SELECT id FROM the_loai WHERE id = ?`, [data.theLoaiId]);
  if (!integer(data.theLoaiId) || !genreExists) {
    details.push({ field: 'theLoaiId', message: 'Thể loại không tồn tại.' });
  }

  if (details.length) fail(400, 'Dữ liệu không hợp lệ.', details);
  return data;
}

async function duplicateMovie(data, id = 0) {
  const duplicate = await get(
    `SELECT id FROM phim WHERE tenKey = ? AND namPhatHanh = ? AND id != ?`,
    [key(data.ten), data.namPhatHanh, id]
  );
  if (duplicate) {
    fail(409, 'Phim và năm phát hành đã tồn tại.', [{ field: 'ten', message: 'Cặp tên phim và năm phát hành không được trùng.' }]);
  }
}

function listFilters(query) {
  const filters = {
    page: query.page === undefined ? 1 : Number(query.page),
    limit: query.limit === undefined ? 8 : Number(query.limit),
    sort: query.sort || 'id',
    order: query.order || 'desc'
  };
  const details = [];
  if (!Number.isSafeInteger(filters.page) || filters.page < 1) {
    details.push({ field: 'page', message: 'page phải là số nguyên dương.' });
  }
  if (!Number.isSafeInteger(filters.limit) || filters.limit < 1 || filters.limit > 100) {
    details.push({ field: 'limit', message: 'limit phải từ 1 đến 100.' });
  }
  if (!['id', 'diemTrungBinh', 'namPhatHanh', 'soDanhGia'].includes(filters.sort)) {
    details.push({ field: 'sort', message: 'Kiểu sắp xếp không hợp lệ.' });
  }
  if (!['asc', 'desc'].includes(filters.order)) {
    details.push({ field: 'order', message: 'order phải là asc hoặc desc.' });
  }
  if (query.q !== undefined) filters.q = trim(query.q);
  if (query.theLoaiId !== undefined) {
    filters.theLoaiId = Number(query.theLoaiId);
    if (!Number.isSafeInteger(filters.theLoaiId) || filters.theLoaiId < 1) {
      details.push({ field: 'theLoaiId', message: 'ID thể loại không hợp lệ.' });
    }
  }
  if (query.namPhatHanh !== undefined) {
    filters.namPhatHanh = Number(query.namPhatHanh);
    if (!Number.isSafeInteger(filters.namPhatHanh)) {
      details.push({ field: 'namPhatHanh', message: 'Năm không hợp lệ.' });
    }
  }
  if (query.gioiHanTuoi !== undefined) {
    filters.gioiHanTuoi = query.gioiHanTuoi;
    if (!['P', 'T13', 'T16', 'T18'].includes(filters.gioiHanTuoi)) {
      details.push({ field: 'gioiHanTuoi', message: 'Giới hạn tuổi không hợp lệ.' });
    }
  }
  if (query.diemMin !== undefined) {
    filters.diemMin = Number(query.diemMin);
    if (!Number.isFinite(filters.diemMin) || filters.diemMin < 1 || filters.diemMin > 10) {
      details.push({ field: 'diemMin', message: 'Điểm tối thiểu phải từ 1 đến 10.' });
    }
  }
  if (details.length) fail(400, 'Tham số không hợp lệ.', details);
  return filters;
}

export async function listMovies(req, res) {
  res.json(await phim.list(listFilters(req.query)));
}

export async function getMovie(req, res) {
  const item = await phim.one(positiveId(req.params.id));
  if (!item) fail(404, 'Không tìm thấy phim.');
  res.json(item);
}

export async function createMovie(req, res) {
  const data = await movieData(req.body || {});
  await duplicateMovie(data);

  const result = await run(
    `INSERT INTO phim (ten, tenKey, daoDien, namPhatHanh, thoiLuong, gioiHanTuoi, theLoaiId)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.ten, key(data.ten), data.daoDien, data.namPhatHanh, data.thoiLuong, data.gioiHanTuoi, data.theLoaiId]
  );

  res.status(201).json(await phim.one(result.lastID));
}

export async function updateMovie(req, res) {
  const id = positiveId(req.params.id);
  const existing = await get(`SELECT id FROM phim WHERE id = ?`, [id]);
  if (!existing) fail(404, 'Không tìm thấy phim.');

  const data = await movieData(req.body || {});
  await duplicateMovie(data, id);

  await run(
    `UPDATE phim SET ten = ?, tenKey = ?, daoDien = ?, namPhatHanh = ?, thoiLuong = ?, gioiHanTuoi = ?, theLoaiId = ?
     WHERE id = ?`,
    [data.ten, key(data.ten), data.daoDien, data.namPhatHanh, data.thoiLuong, data.gioiHanTuoi, data.theLoaiId, id]
  );

  res.json(await phim.one(id));
}

export async function deleteMovie(req, res) {
  const id = positiveId(req.params.id);
  const existing = await get(`SELECT id FROM phim WHERE id = ?`, [id]);
  if (!existing) fail(404, 'Không tìm thấy phim.');

  await run(`DELETE FROM phim WHERE id = ?`, [id]);
  res.json({ message: 'Đã xóa phim.' });
}

export async function reviewMovie(req, res) {
  const id = positiveId(req.params.id);
  const existing = await get(`SELECT id FROM phim WHERE id = ?`, [id]);
  if (!existing) fail(404, 'Không tìm thấy phim.');

  const body = req.body || {};
  const nguoi = trim(body.nguoiDanhGia);
  const diem = body.diem;
  const binhLuan = trim(body.binhLuan);

  const details = [];
  if (!nguoi) details.push({ field: 'nguoiDanhGia', message: 'Tên người đánh giá là bắt buộc.' });
  if (!integer(diem) || diem < 1 || diem > 10) details.push({ field: 'diem', message: 'Điểm phải là số nguyên từ 1 đến 10.' });
  if (typeof body.binhLuan !== 'string') details.push({ field: 'binhLuan', message: 'Bình luận phải là chuỗi.' });
  if (details.length) fail(400, 'Dữ liệu không hợp lệ.', details);

  const duplicateReview = await get(
    `SELECT id FROM danh_gia WHERE phimId = ? AND nguoiDanhGiaKey = ?`,
    [id, key(nguoi)]
  );
  if (duplicateReview) {
    fail(409, 'Bạn đã đánh giá phim này.', [{ field: 'nguoiDanhGia', message: 'Mỗi người chỉ được đánh giá một lần.' }]);
  }

  const ngay = new Date().toISOString();
  const result = await run(
    `INSERT INTO danh_gia (phimId, nguoiDanhGia, nguoiDanhGiaKey, diem, binhLuan, ngay)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, nguoi, key(nguoi), diem, binhLuan, ngay]
  );

  res.status(201).json({ id: result.lastID, nguoiDanhGia: nguoi, diem, binhLuan, ngay });
}

export async function movieStats(req, res) {
  res.json(await phim.stats());
}
