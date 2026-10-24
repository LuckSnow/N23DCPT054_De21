# Đề 21 – Đánh giá phim

- **Họ tên:** Nguyễn Thái Tuấn
- **MSSV:** N23DCPT054
- **Số đề:** 21

## Yêu cầu môi trường

Node.js 20 trở lên, npm và MongoDB Atlas. Backend chạy ở cổng **5019**. Tạo `backend/.env` từ `backend/.env.example`, điền `MONGODB_URI` bằng username và mật khẩu Database Access của Atlas. Giữ file `.env` trên máy, không commit. Nếu mật khẩu có ký tự đặc biệt, mã hóa URL trước khi đặt vào URI. Trong Atlas, cho phép IP máy chạy ứng dụng trong Network Access. Frontend dùng URL API mặc định `http://localhost:5019`; có thể đổi trong `frontend/.env.local` từ file mẫu.

## Cài đặt và chạy

Mở hai terminal tại thư mục gốc:

```powershell
cd backend
npm install
npm run seed
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

Truy cập `http://localhost:3000`. Chạy `npm test` trong `backend` để kiểm tra API, `npm run build` trong `frontend` để kiểm tra bản dựng.

## Chức năng đã làm

- CRUD thể loại, CRUD phim; kiểm tra dữ liệu, tên thể loại duy nhất, cặp tên phim và năm duy nhất, chặn xóa thể loại đang có phim.
- Tìm kiếm theo tên phim/đạo diễn; lọc thể loại, năm, giới hạn tuổi, điểm tối thiểu; sắp xếp, phân trang mặc định 8 phim.
- Chấm điểm và bình luận một lần mỗi người mỗi phim; điểm trung bình, số đánh giá, biểu đồ phân bố điểm, bình luận mới nhất.
- Thống kê điểm theo thể loại và top 5 phim có ít nhất 3 đánh giá.
- Trang danh sách, chi tiết Server Component, thêm/sửa/xóa, quản lý thể loại, thống kê; trạng thái tải/rỗng/lỗi và giao diện màn hình hẹp.
- Seed 4 thể loại, 10 phim, 25 đánh giá; một tên phim chứa MSSV.
- Header `X-Student-Id: N23DCPT054` trên mọi phản hồi backend; footer theo đúng định danh.

## Chức năng chưa làm

Không có theo yêu cầu của đề.

## Cấu trúc và luồng xử lý

- `backend/src/models/db.js` kết nối MongoDB, tạo unique index cho tên thể loại và cặp tên phim/năm; collection `counters` cấp ID số. `models/phim.js` đọc phim và đánh giá nhúng trong phim, tính điểm trung bình, lọc/phân trang và thống kê.
- `backend/src/routes/api.js` định nghĩa endpoint. `controllers/api.js` kiểm tra dữ liệu và quy tắc nghiệp vụ, sau đó gọi model và trả mã 200/201/400/404/409. `middlewares/common.js` gắn mã sinh viên, ghi log và xử lý lỗi tập trung.
- `frontend/src/lib/api.ts` là lớp gọi API và đọc lỗi từng trường. Trang danh sách dùng Client Component để lọc/phân trang, trang chi tiết dùng Server Component để tải phim; các form và nút thao tác dùng Client Component.
- `npm run seed` chỉ nạp vào cơ sở dữ liệu trống; chạy lại sẽ giữ nguyên dữ liệu hiện có. Đảm bảo URI trỏ đúng database trước khi chạy seed.

## API chính

`GET/POST /api/the-loai`, `PUT/DELETE /api/the-loai/:id`; `GET/POST /api/phim`, `GET/PUT/DELETE /api/phim/:id`; `POST /api/phim/:id/danh-gia`; `GET /api/phim/stats`.

Danh sách phim trả `{ data, page, limit, total, totalPages }`; lỗi trả `{ error, details }`. Các tham số danh sách: `q`, `theLoaiId`, `namPhatHanh`, `gioiHanTuoi`, `diemMin`, `sort`, `order`, `page`, `limit`.
