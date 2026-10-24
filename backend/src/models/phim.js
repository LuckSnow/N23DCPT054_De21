import { collection } from './db.js';

export function present(movie, genre, includeReviews = false) {
  const reviews = movie.danhGia || [];
  const score = reviews.length ? Math.round(reviews.reduce((sum, item) => sum + item.diem, 0) / reviews.length * 10) / 10 : null;
  const result = { id: movie.id, ten: movie.ten, daoDien: movie.daoDien, namPhatHanh: movie.namPhatHanh,
    thoiLuong: movie.thoiLuong, gioiHanTuoi: movie.gioiHanTuoi, theLoaiId: movie.theLoaiId,
    tenTheLoai: genre?.ten || '', diemTrungBinh: score, soDanhGia: reviews.length };
  if (includeReviews) {
    result.theLoai = genre ? { id: genre.id, ten: genre.ten } : null;
    result.danhGia = reviews.map(({ nguoiDanhGiaKey, ...review }) => review)
      .sort((a, b) => b.ngay.localeCompare(a.ngay) || b.id - a.id);
  }
  return result;
}
async function allPresented() {
  const [movies, genres] = await Promise.all([
    collection('phim').find({}).toArray(), collection('the_loai').find({}).toArray()
  ]);
  const genreMap = new Map(genres.map(g => [g.id, g]));
  return movies.map(movie => present(movie, genreMap.get(movie.theLoaiId)));
}
export async function one(id) {
  const movie = await collection('phim').findOne({ id });
  if (!movie) return null;
  const genre = await collection('the_loai').findOne({ id: movie.theLoaiId });
  return present(movie, genre, true);
}
export async function list(filters) {
  let data = await allPresented();
  if (filters.q) { const q = filters.q.toLocaleLowerCase('vi'); data = data.filter(m => m.ten.toLocaleLowerCase('vi').includes(q) || m.daoDien.toLocaleLowerCase('vi').includes(q)); }
  for (const key of ['theLoaiId', 'namPhatHanh', 'gioiHanTuoi']) {
    if (filters[key] !== undefined) data = data.filter(m => m[key] === filters[key]);
  }
  if (filters.diemMin !== undefined) data = data.filter(m => m.diemTrungBinh !== null && m.diemTrungBinh >= filters.diemMin);
  const total = data.length, direction = filters.order === 'asc' ? 1 : -1;
  data.sort((a, b) => {
    const av = a[filters.sort], bv = b[filters.sort];
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    return ((av ?? 0) - (bv ?? 0)) * direction || a.id - b.id;
  });
  data = data.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
  return { data, page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) };
}
export async function stats() {
  const [movies, genres] = await Promise.all([collection('phim').find({}).toArray(), collection('the_loai').find({}).sort({ id: 1 }).toArray()]);
  const genreMap = new Map(genres.map(g => [g.id, g]));
  const theoTheLoai = genres.map(genre => {
    const films = movies.filter(m => m.theLoaiId === genre.id);
    const scores = films.flatMap(m => (m.danhGia || []).map(d => d.diem));
    return { theLoaiId: genre.id, tenTheLoai: genre.ten,
      diemTrungBinh: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null,
      soPhim: films.length, soDanhGia: scores.length };
  });
  const top5 = movies.map(m => present(m, genreMap.get(m.theLoaiId))).filter(m => m.soDanhGia >= 3)
    .sort((a, b) => b.diemTrungBinh - a.diemTrungBinh || b.soDanhGia - a.soDanhGia || a.id - b.id).slice(0, 5);
  return { theoTheLoai, top5 };
}
