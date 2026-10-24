import { db } from './models/db.js';

const genres = ['Hành động', 'Tâm lý', 'Khoa học viễn tưởng', 'Hoạt hình'];
const movies = [
  ['Hành trình N23DCPT054', 'Nguyễn Thái Tuấn', 2026, 115, 'P', 4],
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
const existing = db.prepare('SELECT COUNT(*) AS count FROM the_loai').get().count +
  db.prepare('SELECT COUNT(*) AS count FROM phim').get().count +
  db.prepare('SELECT COUNT(*) AS count FROM danh_gia').get().count;
if (existing) {
  console.log('Cơ sở dữ liệu đã có dữ liệu; seed chỉ chạy trên cơ sở dữ liệu trống.');
  process.exit(0);
}
db.exec('BEGIN');
try {
  const addGenre = db.prepare('INSERT INTO the_loai(ten) VALUES(?)');
  const genreIds = genres.map(ten => Number(addGenre.run(ten).lastInsertRowid));
  const addMovie = db.prepare('INSERT INTO phim(ten,dao_dien,nam_phat_hanh,thoi_luong,gioi_han_tuoi,the_loai_id) VALUES(?,?,?,?,?,?)');
  const addReview = db.prepare('INSERT INTO danh_gia(phim_id,nguoi_danh_gia,diem,binh_luan,ngay) VALUES(?,?,?,?,?)');
  movies.forEach((movie, index) => {
    const [ten, daoDien, nam, thoiLuong, tuoi, genre] = movie;
    const id = Number(addMovie.run(ten, daoDien, nam, thoiLuong, tuoi, genreIds[genre - 1]).lastInsertRowid);
    const count = index < 5 ? 3 : 2;
    for (let j = 0; j < count; j++) {
      addReview.run(id, `Thành viên ${j + 1}`, 6 + ((index + j) % 5), comments[(index + j) % 4],
        new Date(Date.UTC(2026, 8, index + 1, j)).toISOString());
    }
  });
  db.exec('COMMIT');
  console.log('Đã tạo 4 thể loại, 10 phim và 25 đánh giá.');
} catch (error) { db.exec('ROLLBACK'); throw error; }
