import Link from 'next/link';
import { API, Movie } from '../../lib/api';
export const dynamic = 'force-dynamic';
type GenreStat={theLoaiId:number;tenTheLoai:string;diemTrungBinh:number|null;soPhim:number;soDanhGia:number};
type Stats={theoTheLoai:GenreStat[];top5:Movie[]};
export default async function StatsPage(){
  let stats:Stats;
  try{const response=await fetch(`${API}/api/phim/stats`,{cache:'no-store'});if(!response.ok)throw new Error();stats=await response.json();}
  catch{return <p className="notice error">Không tải được thống kê. Hãy kiểm tra backend.</p>;}
  return <><h1>Thống kê phim</h1><h2>Điểm trung bình theo thể loại</h2><div className="grid">{stats.theoTheLoai.map(g=><div className="card" key={g.theLoaiId}><h3>{g.tenTheLoai}</h3><p className="score">★ {g.diemTrungBinh??'Chưa có điểm'}</p><p>{g.soPhim} phim · {g.soDanhGia} đánh giá</p></div>)}</div><h2>Top 5 phim điểm cao nhất</h2><p className="muted">Chỉ tính phim có ít nhất 3 đánh giá.</p>{stats.top5.length?<div className="grid">{stats.top5.map((m,i)=><div className="card" key={m.id}><strong>#{i+1} <Link href={`/phim/${m.id}`}>{m.ten}</Link></strong><p className="score">★ {m.diemTrungBinh}/10</p><p>{m.soDanhGia} đánh giá</p></div>)}</div>:<p className="notice">Chưa có phim đủ điều kiện.</p>}</>;
}
