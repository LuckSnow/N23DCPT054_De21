import { connectDb, collection, closeDb } from './models/db.js';

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
  const existing = await Promise.all(['the_loai', 'phim'].map(name => collection(name).estimatedDocumentCount()));
  if (existing.some(Boolean)) {
    console.log('Cơ sở dữ liệu đã có dữ liệu; seed chỉ chạy trên cơ sở dữ liệu trống.');
    process.exitCode = 0;
  } else {
    await collection('the_loai').insertMany(genres.map((ten, index) => ({ id: index + 1, ten, tenKey: ten.toLocaleLowerCase('vi') })));
    const documents = movies.map((movie, index) => {
    const [ten, daoDien, nam, thoiLuong, tuoi, genre] = movie;
    const count = index < 5 ? 3 : 2;
    const danhGia = [];
    for (let j = 0; j < count; j++) {
      danhGia.push({ id: index < 5 ? index * 3 + j + 1 : 16 + (index - 5) * 2 + j,
        nguoiDanhGia: `Thành viên ${j + 1}`, nguoiDanhGiaKey: `thành viên ${j + 1}`,
        diem: 6 + ((index + j) % 5), binhLuan: comments[(index + j) % 4],
        ngay: new Date(Date.UTC(2026, 8, index + 1, j)).toISOString() });
    }
    return { id: index + 1, ten, tenKey: ten.toLocaleLowerCase('vi'), daoDien, namPhatHanh: nam,
      thoiLuong, gioiHanTuoi: tuoi, theLoaiId: genre, danhGia };
    });
    await collection('phim').insertMany(documents);
    await collection('counters').updateOne({ _id: 'the_loai' }, { $set: { value: 4 } }, { upsert: true });
    await collection('counters').updateOne({ _id: 'phim' }, { $set: { value: 10 } }, { upsert: true });
    await collection('counters').updateOne({ _id: 'danh_gia' }, { $set: { value: 25 } }, { upsert: true });
    console.log('Đã tạo 4 thể loại, 10 phim và 25 đánh giá.');
  }
} catch (error) { console.error('Seed thất bại:', error.message); process.exitCode = 1; }
finally { await closeDb(); }
