'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, message } from '../../../lib/api';
export default function MovieActions({id}:{id:number}) {
  const router=useRouter(), [error,setError]=useState('');
  async function remove() { if(!window.confirm('Bạn chắc chắn muốn xóa phim này?')) return;
    try { await api(`/api/phim/${id}`,{method:'DELETE'}); router.push('/phim'); router.refresh(); } catch(e) {setError(message(e));} }
  return <div><div className="actions"><Link className="button secondary" href={`/phim/${id}/edit`}>Sửa</Link><button className="danger" onClick={remove}>Xóa</button></div>{error&&<p className="error">{error}</p>}</div>;
}
