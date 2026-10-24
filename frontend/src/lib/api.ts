export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5019';
export type Genre = { id: number; ten: string };
export type Review = { id: number; nguoiDanhGia: string; diem: number; binhLuan: string; ngay: string };
export type Movie = { id: number; ten: string; daoDien: string; namPhatHanh: number; thoiLuong: number;
  gioiHanTuoi: string; theLoaiId: number; tenTheLoai: string; theLoai?: Genre;
  diemTrungBinh: number | null; soDanhGia: number; danhGia?: Review[] };
export type PageResult = { data: Movie[]; page: number; limit: number; total: number; totalPages: number };
export type ApiError = { error: string; details?: { field: string; message: string }[] };
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { cache: 'no-store', ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result as T;
}
export function message(error: unknown): string { return (error as ApiError)?.error || 'Không thể kết nối API.'; }
export function fieldErrors(error: unknown): Record<string, string> {
  return Object.fromEntries(((error as ApiError)?.details || []).map(d => [d.field, d.message]));
}
