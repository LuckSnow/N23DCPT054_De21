'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Genre, message, PageResult } from '../../lib/api';
export default function MovieList() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [filters, setFilters] = useState({ q:'', theLoaiId:'', namPhatHanh:'', gioiHanTuoi:'', diemMin:'', sort:'id', order:'desc' });
  const [page, setPage] = useState(1), [result, setResult] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => { api<Genre[]>('/api/the-loai').then(setGenres).catch(e => setError(message(e))); }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ page: String(page), ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) });
      api<PageResult>(`/api/phim?${params}`).then(data => { if(active) setResult(data); })
        .catch(e => { if(active) setError(message(e)); }).finally(() => { if(active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [filters, page]);
  const update = (key: keyof typeof filters, value: string) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };
  return <><div className="header-row"><div><h1>Danh sách phim</h1><p className="muted">Khám phá, quản lý và chấm điểm phim.</p></div><Link className="button" href="/phim/new">+ Thêm phim</Link></div>
    <div className="filters panel"><input aria-label="Tìm phim hoặc đạo diễn" placeholder="Tên phim hoặc đạo diễn" value={filters.q} onChange={e=>update('q',e.target.value)}/>
      <select aria-label="Thể loại" value={filters.theLoaiId} onChange={e=>update('theLoaiId',e.target.value)}><option value="">Mọi thể loại</option>{genres.map(g=><option key={g.id} value={g.id}>{g.ten}</option>)}</select>
      <input aria-label="Năm phát hành" type="number" placeholder="Năm phát hành" value={filters.namPhatHanh} onChange={e=>update('namPhatHanh',e.target.value)}/>
      <select aria-label="Giới hạn tuổi" value={filters.gioiHanTuoi} onChange={e=>update('gioiHanTuoi',e.target.value)}><option value="">Mọi độ tuổi</option>{['P','T13','T16','T18'].map(x=><option key={x}>{x}</option>)}</select>
      <input aria-label="Điểm tối thiểu" type="number" min="1" max="10" step="0.1" placeholder="Điểm tối thiểu" value={filters.diemMin} onChange={e=>update('diemMin',e.target.value)}/>
      <select aria-label="Sắp xếp" value={filters.sort} onChange={e=>update('sort',e.target.value)}><option value="id">Mới thêm</option><option value="diemTrungBinh">Điểm trung bình</option><option value="namPhatHanh">Năm phát hành</option><option value="soDanhGia">Số đánh giá</option></select>
      <select aria-label="Thứ tự" value={filters.order} onChange={e=>update('order',e.target.value)}><option value="desc">Giảm dần</option><option value="asc">Tăng dần</option></select></div>
    {loading ? <p>Đang tải phim...</p> : error ? <p className="notice error">{error}</p> : !result?.data.length ? <p className="notice">Không tìm thấy phim phù hợp.</p> : <><p className="muted">{result.total} phim</p><div className="grid">{result.data.map(m=><article className="card" key={m.id}><h2><Link href={`/phim/${m.id}`}>{m.ten}</Link></h2><p>{m.tenTheLoai} · {m.namPhatHanh} · {m.gioiHanTuoi}</p><p>Đạo diễn: {m.daoDien}</p><p className="score">★ {m.diemTrungBinh === null ? 'Chưa có điểm' : `${m.diemTrungBinh}/10`} <span className="muted">({m.soDanhGia} đánh giá)</span></p></article>)}</div><div className="pagination"><button disabled={page<=1} onClick={()=>setPage(page-1)}>Trước</button><span>Trang {page}/{result.totalPages}</span><button disabled={page>=result.totalPages} onClick={()=>setPage(page+1)}>Sau</button></div></>}</>;
}
