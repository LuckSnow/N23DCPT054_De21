import { connectDb, run, get, closeDb } from './models/db.js';

const genres = ['Hành động', 'Tâm lý', 'Khoa học viễn tưởng', 'Hoạt hình'];
const movies = [
  ['N23DCPT054', 'Nguyễn Thái Tuấn', 2026, 115, 'P', 4],
  ['Bầu trời phương Nam', 'Trần Minh', 2022, 122, 'T13', 2],
  ['Thành phố sao', 'Lê An', 2024, 138, 'T13', 3],
  ['Cuộc đua cuối', 'Phạm Hải', 2021, 110, 'T16', 1],
  ['Ký ức mùa hè', 'Võ Linh', 2020, 97, 'P', 2],
  ['Vệ tinh xanh', 'Hoàng Duy', 2025, 142, 'T13', 3],
  ['Chú mèo phi hành gia', 'Bùi Hoa', 2023, 88, 'P', 4],
  ['Đường về', 'Đặng Phúc', 2019, 106, 'T16', 1],
  ['Mật mã đại dương', 'Ngô Bình', 2024, 128, 'T18', 1],
  ['Ngày mới', 'Đỗ Hạnh', 2023, 101, 'P', 2]
];
const comments = ['Phim rất cuốn hút.', 'Diễn xuất tốt.', 'Hình ảnh đẹp.', 'Câu chuyện thú vị.'];

try {
  await connectDb();
  const countTheLoai = (await get('SELECT COUNT(*) as count FROM the_loai'))?.count || 0;
  const countPhim = (await get('SELECT COUNT(*) as count FROM phim'))?.count || 0;

  if (countTheLoai > 0 || countPhim > 0) {
    console.log('Cơ sở dữ liệu đã có dữ liệu; seed chỉ chạy trên cơ sở dữ liệu trống.');
    process.exitCode = 0;
  } else {
    for (const ten of genres) {
      await run('INSERT INTO the_loai (ten, tenKey) VALUES (?, ?)', [ten, ten.toLocaleLowerCase('vi')]);
    }

    let reviewIndex = 1;
    for (let index = 0; index < movies.length; index++) {
      const [ten, daoDien, nam, thoiLuong, tuoi, genre] = movies[index];
      const res = await run(
        `INSERT INTO phim (ten, tenKey, daoDien, namPhatHanh, thoiLuong, gioiHanTuoi, theLoaiId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ten, ten.toLocaleLowerCase('vi'), daoDien, nam, thoiLuong, tuoi, genre]
      );
      const phimId = res.lastID;
      const count = index < 5 ? 3 : 2;

      for (let j = 0; j < count; j++) {
        const nguoi = `Thành viên ${j + 1}`;
        const diem = 6 + ((index + j) % 5);
        const binhLuan = comments[(index + j) % 4];
        const ngay = new Date(Date.UTC(2026, 8, index + 1, j)).toISOString();

        await run(
          `INSERT INTO danh_gia (phimId, nguoiDanhGia, nguoiDanhGiaKey, diem, binhLuan, ngay)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [phimId, nguoi, nguoi.toLocaleLowerCase('vi'), diem, binhLuan, ngay]
        );
        reviewIndex++;
      }
    }

    console.log('Đã tạo 4 thể loại, 10 phim và 25 đánh giá.');
  }
} catch (error) {
  console.error('Seed thất bại:', error.message);
  process.exitCode = 1;
} finally {
  await closeDb();
}
