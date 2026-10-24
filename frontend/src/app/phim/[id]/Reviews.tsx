'use client';
import { FormEvent, useState } from 'react';
import { api, fieldErrors, message, Movie, Review } from '../../../lib/api';
export default function Reviews({movie}:{movie:Movie}) {
  const [reviews,setReviews]=useState<Review[]>(movie.danhGia||[]), [name,setName]=useState(''), [score,setScore]=useState(''), [comment,setComment]=useState('');
  const [errors,setErrors]=useState<Record<string,string>>({}), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  const counts=Array.from({length:10},(_,i)=>reviews.filter(r=>r.diem===10-i).length), max=Math.max(1,...counts);
  const average=reviews.length ? (reviews.reduce((n,r)=>n+r.diem,0)/reviews.length).toFixed(1) : null;
  async function submit(event:FormEvent) { event.preventDefault(); const found:Record<string,string>={};
    if(!name.trim()) found.nguoiDanhGia='Vui lòng nhập tên.';
    if(!Number.isInteger(Number(score))||Number(score)<1||Number(score)>10) found.diem='Chọn điểm từ 1 đến 10.';
    setErrors(found); if(Object.keys(found).length) return;
    setBusy(true);setError('');
    try { const review=await api<Review>(`/api/phim/${movie.id}/danh-gia`,{method:'POST',body:JSON.stringify({nguoiDanhGia:name,diem:Number(score),binhLuan:comment})});
      setReviews(r=>[review,...r]);setName('');setScore('');setComment('');setErrors({});
    } catch(e) {setError(message(e));setErrors(fieldErrors(e));} finally {setBusy(false);} }
  return <div className="grid" style={{marginTop:20}}><section className="panel"><h2>Phân bố điểm</h2><p>Điểm hiện tại: <b>{average??'Chưa có'}</b> · {reviews.length} lượt</p>{counts.map((count,i)=><div className="bar-row" key={i}><span>{10-i}</span><div className="bar-track"><div className="bar-fill" style={{width:`${count/max*100}%`}}/></div><span>{count}</span></div>)}</section>
    <section className="panel"><h2>Viết đánh giá</h2>{error&&<p className="notice error">{error}</p>}<form onSubmit={submit} noValidate><div className="field"><label htmlFor="name">Tên của bạn</label><input id="name" value={name} onChange={e=>setName(e.target.value)}/>{errors.nguoiDanhGia&&<span className="error">{errors.nguoiDanhGia}</span>}</div><div className="field"><label htmlFor="score">Điểm</label><select id="score" value={score} onChange={e=>setScore(e.target.value)}><option value="">Chọn điểm</option>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>{errors.diem&&<span className="error">{errors.diem}</span>}</div><div className="field"><label htmlFor="comment">Bình luận</label><textarea id="comment" value={comment} onChange={e=>setComment(e.target.value)}/>{errors.binhLuan&&<span className="error">{errors.binhLuan}</span>}</div><button disabled={busy}>{busy?'Đang gửi...':'Gửi đánh giá'}</button></form></section>
    <section className="panel" style={{gridColumn:'1/-1'}}><h2>Bình luận mới nhất</h2>{!reviews.length?<p className="muted">Chưa có bình luận.</p>:reviews.map(r=><div className="review" key={r.id}><b>{r.nguoiDanhGia}</b> · <span className="score">{r.diem}/10</span> · <small className="muted">{new Date(r.ngay).toLocaleString('vi-VN')}</small><p>{r.binhLuan||'Không có bình luận.'}</p></div>)}</section></div>;
}
