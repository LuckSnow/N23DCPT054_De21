import { all, get, run } from './db.js';

export function present(movie, reviews = [], includeReviews = false) {
  const score = reviews.length
    ? Math.round((reviews.reduce((sum, item) => sum + item.diem, 0) / reviews.length) * 10) / 10
    : null;

  const result = {
    id: movie.id,
    ten: movie.ten,
    daoDien: movie.daoDien,
    namPhatHanh: movie.namPhatHanh,
    thoiLuong: movie.thoiLuong,
    gioiHanTuoi: movie.gioiHanTuoi,
    theLoaiId: movie.theLoaiId,
    tenTheLoai: movie.tenTheLoai || '',
    diemTrungBinh: score,
    soDanhGia: reviews.length
  };

  if (includeReviews) {
    result.theLoai = movie.theLoaiId ? { id: movie.theLoaiId, ten: movie.tenTheLoai || '' } : null;
    result.danhGia = reviews
      .map(({ nguoiDanhGiaKey, phimId, ...r }) => r)
      .sort((a, b) => b.ngay.localeCompare(a.ngay) || b.id - a.id);
  }

  return result;
}

export async function one(id) {
  const movie = await get(`
    SELECT p.*, tl.ten AS tenTheLoai
    FROM phim p
    LEFT JOIN the_loai tl ON p.theLoaiId = tl.id
    WHERE p.id = ?
  `, [id]);

  if (!movie) return null;

  const reviews = await all(`
    SELECT id, phimId, nguoiDanhGia, diem, binhLuan, ngay
    FROM danh_gia
    WHERE phimId = ?
    ORDER BY ngay DESC, id DESC
  `, [id]);

  return present(movie, reviews, true);
}

export async function list(filters) {
  const movies = await all(`
    SELECT p.*, tl.ten AS tenTheLoai
    FROM phim p
    LEFT JOIN the_loai tl ON p.theLoaiId = tl.id
  `);

  const allReviews = await all(`SELECT id, phimId, diem, ngay FROM danh_gia`);
  const reviewMap = new Map();
  for (const r of allReviews) {
    if (!reviewMap.has(r.phimId)) reviewMap.set(r.phimId, []);
    reviewMap.get(r.phimId).push(r);
  }

  let data = movies.map(m => present(m, reviewMap.get(m.id) || []));

  if (filters.q) {
    const q = filters.q.toLocaleLowerCase('vi');
    data = data.filter(m =>
      m.ten.toLocaleLowerCase('vi').includes(q) ||
      m.daoDien.toLocaleLowerCase('vi').includes(q)
    );
  }

  for (const key of ['theLoaiId', 'namPhatHanh', 'gioiHanTuoi']) {
    if (filters[key] !== undefined) {
      data = data.filter(m => m[key] === filters[key]);
    }
  }

  if (filters.diemMin !== undefined) {
    data = data.filter(m => m.diemTrungBinh !== null && m.diemTrungBinh >= filters.diemMin);
  }

  const total = data.length;
  const direction = filters.order === 'asc' ? 1 : -1;

  data.sort((a, b) => {
    const av = a[filters.sort];
    const bv = b[filters.sort];
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    return ((av ?? 0) - (bv ?? 0)) * direction || a.id - b.id;
  });

  const paginatedData = data.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
  return {
    data: paginatedData,
    page: filters.page,
    limit: filters.limit,
    total,
    totalPages: Math.ceil(total / filters.limit)
  };
}

export async function stats() {
  const genres = await all(`SELECT id, ten FROM the_loai ORDER BY id ASC`);
  const movies = await all(`SELECT id, theLoaiId, ten, daoDien, namPhatHanh, thoiLuong, gioiHanTuoi FROM phim`);
  const reviews = await all(`SELECT id, phimId, diem FROM danh_gia`);

  const movieMap = new Map(movies.map(m => [m.id, m]));
  const reviewMap = new Map();
  for (const r of reviews) {
    if (!reviewMap.has(r.phimId)) reviewMap.set(r.phimId, []);
    reviewMap.get(r.phimId).push(r);
  }

  const theoTheLoai = genres.map(genre => {
    const films = movies.filter(m => m.theLoaiId === genre.id);
    const filmIds = new Set(films.map(f => f.id));
    const scores = reviews.filter(r => filmIds.has(r.phimId)).map(r => r.diem);
    return {
      theLoaiId: genre.id,
      tenTheLoai: genre.ten,
      diemTrungBinh: scores.length
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : null,
      soPhim: films.length,
      soDanhGia: scores.length
    };
  });

  const top5 = movies.map(m => {
    const mReviews = reviewMap.get(m.id) || [];
    const genre = genres.find(g => g.id === m.theLoaiId);
    return present({ ...m, tenTheLoai: genre?.ten || '' }, mReviews);
  })
    .filter(m => m.soDanhGia >= 3)
    .sort((a, b) => b.diemTrungBinh - a.diemTrungBinh || b.soDanhGia - a.soDanhGia || a.id - b.id)
    .slice(0, 5);

  return { theoTheLoai, top5 };
}
