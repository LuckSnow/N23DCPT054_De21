'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, fieldErrors, Genre, message, Movie } from '../../lib/api';
type Values = { ten: string; daoDien: string; namPhatHanh: string; thoiLuong: string; gioiHanTuoi: string; theLoaiId: string };
const empty: Values = { ten:'', daoDien:'', namPhatHanh:'', thoiLuong:'', gioiHanTuoi:'P', theLoaiId:'' };
export default function MovieForm({ id }: { id?: string }) {
  const router = useRouter(), [values, setValues] = useState<Values>(empty), [genres, setGenres] = useState<Genre[]>([]);
  const [errors, setErrors] = useState<Record<string,string>>({}), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Genre[]>('/api/the-loai').then(setGenres).catch(e=>setError(message(e)));
    if (id) api<Movie>(`/api/phim/${id}`).then(m=>setValues({ten:m.ten,daoDien:m.daoDien,namPhatHanh:String(m.namPhatHanh),thoiLuong:String(m.thoiLuong),gioiHanTuoi:m.gioiHanTuoi,theLoaiId:String(m.theLoaiId)})).catch(e=>setError(message(e)));
  }, [id]);
  const set = (key: keyof Values, value: string) => { setValues(v=>({...v,[key]:value})); setErrors(e=>({...e,[key]:''})); };
  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string,string> = {};
    if (!values.ten.trim()) found.ten='Vui lòng nhập tên phim.';
    if (!values.daoDien.trim()) found.daoDien='Vui lòng nhập đạo diễn.';
    const year = Number(values.namPhatHanh), length = Number(values.thoiLuong);
    if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear()+1) found.namPhatHanh='Năm phải từ 1950 đến năm sau.';
    if (!Number.isInteger(length) || length < 30 || length > 300) found.thoiLuong='Thời lượng phải từ 30 đến 300 phút.';
    if (!values.theLoaiId) found.theLoaiId='Vui lòng chọn thể loại.';
    setErrors(found); if (Object.keys(found).length) return;
    setBusy(true); setError('');
    try {
      const movie = await api<Movie>(id ? `/api/phim/${id}` : '/api/phim', { method:id?'PUT':'POST', body:JSON.stringify({...values,namPhatHanh:year,thoiLuong:length,theLoaiId:Number(values.theLoaiId)}) });
      router.push(`/phim/${movie.id}`); router.refresh();
    } catch(e) { setError(message(e)); setErrors(fieldErrors(e)); } finally { setBusy(false); }
  }
  return <div className="panel"><h1>{id?'Sửa phim':'Thêm phim'}</h1>{error&&<p className="notice error">{error}</p>}<form onSubmit={submit} noValidate>
    {([['ten','Tên phim'],['daoDien','Đạo diễn'],['namPhatHanh','Năm phát hành'],['thoiLuong','Thời lượng (phút)']] as const).map(([key,label])=><div className="field" key={key}><label htmlFor={key}>{label}</label><input id={key} type={key==='namPhatHanh'||key==='thoiLuong'?'number':'text'} value={values[key]} onChange={e=>set(key,e.target.value)}/>{errors[key]&&<span className="error">{errors[key]}</span>}</div>)}
    <div className="field"><label htmlFor="gioiHanTuoi">Giới hạn tuổi</label><select id="gioiHanTuoi" value={values.gioiHanTuoi} onChange={e=>set('gioiHanTuoi',e.target.value)}>{['P','T13','T16','T18'].map(x=><option key={x}>{x}</option>)}</select>{errors.gioiHanTuoi&&<span className="error">{errors.gioiHanTuoi}</span>}</div>
    <div className="field"><label htmlFor="theLoaiId">Thể loại</label><select id="theLoaiId" value={values.theLoaiId} onChange={e=>set('theLoaiId',e.target.value)}><option value="">Chọn thể loại</option>{genres.map(g=><option key={g.id} value={g.id}>{g.ten}</option>)}</select>{errors.theLoaiId&&<span className="error">{errors.theLoaiId}</span>}</div>
    <button disabled={busy}>{busy?'Đang lưu...':'Lưu phim'}</button></form></div>;
}
