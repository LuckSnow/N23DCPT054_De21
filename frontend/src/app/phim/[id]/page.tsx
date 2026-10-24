import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API, Movie } from '../../../lib/api';
import MovieActions from './MovieActions';
import Reviews from './Reviews';
export default async function MovieDetail({ params }: { params: Promise<{id:string}> }) {
  const {id}=await params;
  let movie: Movie;
  try {
    const response = await fetch(`${API}/api/phim/${encodeURIComponent(id)}`, {cache:'no-store'});
    if(response.status===404) notFound();
    if(!response.ok) throw new Error('Không tải được phim.');
    movie=await response.json();
  } catch(error) { if ((error as {digest?:string}).digest?.startsWith('NEXT_HTTP_ERROR_FALLBACK')) throw error; return <p className="notice error">Không thể kết nối API. Hãy kiểm tra backend.</p>; }
  return <><p><Link href="/phim">← Danh sách phim</Link></p><div className="header-row"><h1>{movie.ten}</h1><MovieActions id={movie.id}/></div>
    <div className="grid"><section className="panel"><h2>Thông tin</h2><p><b>Đạo diễn:</b> {movie.daoDien}</p><p><b>Thể loại:</b> {movie.theLoai?.ten ?? movie.tenTheLoai}</p><p><b>Năm phát hành:</b> {movie.namPhatHanh}</p><p><b>Thời lượng:</b> {movie.thoiLuong} phút</p><p><b>Giới hạn tuổi:</b> {movie.gioiHanTuoi}</p></section><section className="panel"><h2>Đánh giá</h2><p className="score">★ {movie.diemTrungBinh===null?'Chưa có điểm':`${movie.diemTrungBinh}/10`}</p><p>{movie.soDanhGia} lượt đánh giá</p></section></div>
    <Reviews movie={movie}/></>;
}
