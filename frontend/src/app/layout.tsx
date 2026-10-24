import Link from 'next/link';
import './globals.css';
export const metadata = { title: 'Câu lạc bộ điện ảnh | Đề 21', description: 'Quản lý và đánh giá phim' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body><div className="shell"><header className="topbar"><Link className="brand" href="/">🎬 Góc Điện Ảnh</Link><nav><Link href="/phim">Phim</Link><Link href="/the-loai">Thể loại</Link><Link href="/stats">Thống kê</Link></nav></header><main>{children}</main><footer>Nguyễn Thái Tuấn – N23DCPT054 – Đề 21</footer></div></body></html>;
}
