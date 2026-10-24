import { collection } from '../models/db.js';
import * as phim from '../models/phim.js';
import { HttpError } from '../middlewares/common.js';

const fail = (status, message, details = []) => { throw new HttpError(status, message, details); };
const positiveId = value => { const n = Number(value); if (!Number.isSafeInteger(n) || n < 1) fail(400, 'ID không hợp lệ.'); return n; };
const trim = value => typeof value === 'string' ? value.trim() : '';
const integer = value => typeof value === 'number' && Number.isInteger(value);
const exists = (table, id) => collection(table).findOne({ id });
const key = value => value.toLocaleLowerCase('vi');
async function nextId(name) {
  const result = await collection('counters').findOneAndUpdate({ _id: name }, { $inc: { value: 1 } },
    { upsert: true, returnDocument: 'after' });
  return result.value;
}

export async function listGenres(req, res) { res.json((await collection('the_loai').find({}).sort({ ten: 1 }).toArray()).map(({id,ten})=>({id,ten}))); }
export async function createGenre(req, res) {
  const ten = trim(req.body?.ten);
  if (!ten) fail(400, 'Dữ liệu không hợp lệ.', [{ field: 'ten', message: 'Tên thể loại là bắt buộc.' }]);
  if (await collection('the_loai').findOne({ tenKey: key(ten) })) fail(409, 'Thể loại đã tồn tại.', [{ field: 'ten', message: 'Tên thể loại không được trùng.' }]);
  const id = await nextId('the_loai');
  await collection('the_loai').insertOne({ id, ten, tenKey: key(ten) });
  res.status(201).json({ id, ten });
}
export async function updateGenre(req, res) {
  const id = positiveId(req.params.id), ten = trim(req.body?.ten);
  if (!await exists('the_loai', id)) fail(404, 'Không tìm thấy thể loại.');
  if (!ten) fail(400, 'Dữ liệu không hợp lệ.', [{ field: 'ten', message: 'Tên thể loại là bắt buộc.' }]);
  if (await collection('the_loai').findOne({ tenKey: key(ten), id: { $ne: id } })) fail(409, 'Thể loại đã tồn tại.', [{ field: 'ten', message: 'Tên thể loại không được trùng.' }]);
  await collection('the_loai').updateOne({ id }, { $set: { ten, tenKey: key(ten) } }); res.json({ id, ten });
}
export async function deleteGenre(req, res) {
  const id = positiveId(req.params.id);
  if (!await exists('the_loai', id)) fail(404, 'Không tìm thấy thể loại.');
  if (await collection('phim').findOne({ theLoaiId: id })) fail(409, 'Thể loại đang có phim, không thể xóa.');
  await collection('the_loai').deleteOne({ id }); res.json({ message: 'Đã xóa thể loại.' });
}
async function movieData(body) {
  const data = { ten: trim(body.ten), daoDien: trim(body.daoDien), namPhatHanh: body.namPhatHanh,
    thoiLuong: body.thoiLuong, gioiHanTuoi: body.gioiHanTuoi, theLoaiId: body.theLoaiId };
  const details = [];
  if (!data.ten) details.push({ field: 'ten', message: 'Tên phim là bắt buộc.' });
  if (!data.daoDien) details.push({ field: 'daoDien', message: 'Đạo diễn là bắt buộc.' });
  if (!integer(data.namPhatHanh) || data.namPhatHanh < 1950 || data.namPhatHanh > new Date().getFullYear() + 1) details.push({ field: 'namPhatHanh', message: 'Năm phát hành không hợp lệ.' });
  if (!integer(data.thoiLuong) || data.thoiLuong < 30 || data.thoiLuong > 300) details.push({ field: 'thoiLuong', message: 'Thời lượng phải từ 30 đến 300 phút.' });
  if (!['P','T13','T16','T18'].includes(data.gioiHanTuoi)) details.push({ field: 'gioiHanTuoi', message: 'Giới hạn tuổi không hợp lệ.' });
  if (!integer(data.theLoaiId) || !await exists('the_loai', data.theLoaiId)) details.push({ field: 'theLoaiId', message: 'Thể loại không tồn tại.' });
  if (details.length) fail(400, 'Dữ liệu không hợp lệ.', details);
  return data;
}
async function duplicateMovie(data, id = 0) {
  if (await collection('phim').findOne({ tenKey: key(data.ten), namPhatHanh: data.namPhatHanh, id: { $ne: id } }))
    fail(409, 'Phim và năm phát hành đã tồn tại.', [{ field: 'ten', message: 'Cặp tên phim và năm phát hành không được trùng.' }]);
}
function listFilters(query) {
  const filters = { page: query.page === undefined ? 1 : Number(query.page), limit: query.limit === undefined ? 8 : Number(query.limit),
    sort: query.sort || 'id', order: query.order || 'desc' };
  const details = [];
  if (!Number.isSafeInteger(filters.page) || filters.page < 1) details.push({ field: 'page', message: 'page phải là số nguyên dương.' });
  if (!Number.isSafeInteger(filters.limit) || filters.limit < 1 || filters.limit > 100) details.push({ field: 'limit', message: 'limit phải từ 1 đến 100.' });
  if (!['id','diemTrungBinh','namPhatHanh','soDanhGia'].includes(filters.sort)) details.push({ field: 'sort', message: 'Kiểu sắp xếp không hợp lệ.' });
  if (!['asc','desc'].includes(filters.order)) details.push({ field: 'order', message: 'order phải là asc hoặc desc.' });
  if (query.q !== undefined) filters.q = trim(query.q);
  if (query.theLoaiId !== undefined) { filters.theLoaiId = Number(query.theLoaiId); if (!Number.isSafeInteger(filters.theLoaiId) || filters.theLoaiId < 1) details.push({ field: 'theLoaiId', message: 'ID thể loại không hợp lệ.' }); }
  if (query.namPhatHanh !== undefined) { filters.namPhatHanh = Number(query.namPhatHanh); if (!Number.isSafeInteger(filters.namPhatHanh)) details.push({ field: 'namPhatHanh', message: 'Năm không hợp lệ.' }); }
  if (query.gioiHanTuoi !== undefined) { filters.gioiHanTuoi = query.gioiHanTuoi; if (!['P','T13','T16','T18'].includes(filters.gioiHanTuoi)) details.push({ field: 'gioiHanTuoi', message: 'Giới hạn tuổi không hợp lệ.' }); }
  if (query.diemMin !== undefined) { filters.diemMin = Number(query.diemMin); if (!Number.isFinite(filters.diemMin) || filters.diemMin < 1 || filters.diemMin > 10) details.push({ field: 'diemMin', message: 'Điểm tối thiểu phải từ 1 đến 10.' }); }
  if (details.length) fail(400, 'Tham số không hợp lệ.', details);
  return filters;
}
export async function listMovies(req, res) { res.json(await phim.list(listFilters(req.query))); }
export async function getMovie(req, res) { const item = await phim.one(positiveId(req.params.id)); if (!item) fail(404, 'Không tìm thấy phim.'); res.json(item); }
export async function createMovie(req, res) {
  const data = await movieData(req.body || {}); await duplicateMovie(data);
  const id = await nextId('phim');
  await collection('phim').insertOne({ id, ...data, tenKey: key(data.ten), danhGia: [] });
  res.status(201).json(await phim.one(id));
}
export async function updateMovie(req, res) {
  const id = positiveId(req.params.id); if (!await exists('phim', id)) fail(404, 'Không tìm thấy phim.');
  const data = await movieData(req.body || {}); await duplicateMovie(data, id);
  await collection('phim').updateOne({ id }, { $set: { ...data, tenKey: key(data.ten) } });
  res.json(await phim.one(id));
}
export async function deleteMovie(req, res) {
  const id = positiveId(req.params.id); if (!await exists('phim', id)) fail(404, 'Không tìm thấy phim.');
  await collection('phim').deleteOne({ id }); res.json({ message: 'Đã xóa phim.' });
}
export async function reviewMovie(req, res) {
  const id = positiveId(req.params.id); if (!await exists('phim', id)) fail(404, 'Không tìm thấy phim.');
  const body = req.body || {};
  const nguoi = trim(body.nguoiDanhGia), diem = body.diem, binhLuan = trim(body.binhLuan);
  const details = [];
  if (!nguoi) details.push({ field: 'nguoiDanhGia', message: 'Tên người đánh giá là bắt buộc.' });
  if (!integer(diem) || diem < 1 || diem > 10) details.push({ field: 'diem', message: 'Điểm phải là số nguyên từ 1 đến 10.' });
  if (typeof body.binhLuan !== 'string') details.push({ field: 'binhLuan', message: 'Bình luận phải là chuỗi.' });
  if (details.length) fail(400, 'Dữ liệu không hợp lệ.', details);
  const ngay = new Date().toISOString();
  const reviewId = await nextId('danh_gia');
  const updated = await collection('phim').updateOne({ id, 'danhGia.nguoiDanhGiaKey': { $ne: key(nguoi) } },
    { $push: { danhGia: { id: reviewId, nguoiDanhGia: nguoi, nguoiDanhGiaKey: key(nguoi), diem, binhLuan, ngay } } });
  if (!updated.modifiedCount) fail(409, 'Bạn đã đánh giá phim này.', [{ field: 'nguoiDanhGia', message: 'Mỗi người chỉ được đánh giá một lần.' }]);
  res.status(201).json({ id: reviewId, nguoiDanhGia: nguoi, diem, binhLuan, ngay });
}
export async function movieStats(req, res) { res.json(await phim.stats()); }
