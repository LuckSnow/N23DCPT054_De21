'use client';
import { FormEvent, useEffect, useState } from 'react';
import { api, fieldErrors, Genre, message } from '../../lib/api';
export default function GenrePage() {
  const [items,setItems]=useState<Genre[]>([]),[name,setName]=useState(''),[editing,setEditing]=useState<number|null>(null);
  const [error,setError]=useState(''),[fieldError,setFieldError]=useState(''),[loading,setLoading]=useState(true);
  async function reload() {try{setItems(await api<Genre[]>('/api/the-loai'));setError('');}catch(e){setError(message(e));}finally{setLoading(false);}}
  useEffect(()=>{void reload();},[]);
  async function submit(event:FormEvent) {event.preventDefault();setError('');setFieldError('');if(!name.trim()){setFieldError('Tên thể loại là bắt buộc.');return;}
    try{await api(editing?`/api/the-loai/${editing}`:'/api/the-loai',{method:editing?'PUT':'POST',body:JSON.stringify({ten:name})});setName('');setEditing(null);await reload();}
    catch(e){setError(message(e));setFieldError(fieldErrors(e).ten||'');}}
  async function remove(id:number){if(!window.confirm('Bạn chắc chắn muốn xóa thể loại này?'))return;try{await api(`/api/the-loai/${id}`,{method:'DELETE'});await reload();}catch(e){setError(message(e));}}
  return <><h1>Quản lý thể loại</h1><div className="panel"><h2>{editing?'Sửa thể loại':'Thêm thể loại'}</h2><form onSubmit={submit}><div className="field"><label htmlFor="genre">Tên thể loại</label><input id="genre" value={name} onChange={e=>setName(e.target.value)}/>{fieldError&&<span className="error">{fieldError}</span>}</div><div className="actions" style={{justifyContent:'flex-start'}}><button>{editing?'Lưu thay đổi':'Thêm'}</button>{editing&&<button className="secondary" type="button" onClick={()=>{setEditing(null);setName('');setFieldError('');}}>Hủy</button>}</div></form></div>
  {error&&<p className="notice error">{error}</p>}{loading?<p>Đang tải...</p>:!items.length?<p>Chưa có thể loại.</p>:<div className="grid" style={{marginTop:20}}>{items.map(g=><div className="card header-row" key={g.id}><strong>{g.ten}</strong><div className="actions"><button className="secondary" onClick={()=>{setEditing(g.id);setName(g.ten);setFieldError('');}}>Sửa</button><button className="danger" onClick={()=>remove(g.id)}>Xóa</button></div></div>)}</div>}</>;
}
