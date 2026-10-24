# Đề 21 – Đánh giá phim

- **Họ tên:** Nguyễn Thái Tuấn
- **MSSV:** N23DCPT054
- **Số đề:** 21

## Yêu cầu môi trường

- Node.js 20 trở lên, npm.
- CSDL sử dụng **SQLite** lưu trực tiếp trong file `backend/data/cinema.sqlite`, không cần cài đặt dịch vụ database bên ngoài hay cấu hình đám mây.
- Backend chạy ở cổng **5019** (cấu hình trong `backend/.env`).
- Frontend chạy ở cổng **3000** và gọi API mặc định `http://localhost:5019`.

## Cài đặt và chạy

Mở hai terminal tại thư mục gốc:

```powershell
cd backend
npm install
npm run seed    # (chỉ cần chạy nếu muốn nạp lại dữ liệu mẫu vào database trống)
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

Truy cập `http://localhost:3000`.

## Chức năng đã làm

- **CRUD thể loại, CRUD phim:** kiểm tra dữ liệu đầu vào, tên thể loại duy nhất, cặp tên phim và năm phát hành duy nhất, chặn xóa thể loại đang có phim.
- **Tìm kiếm & lọc:** tìm kiếm theo tên phim/đạo diễn (`q`); lọc thể loại (`theLoaiId`), năm phát hành (`namPhatHanh`), giới hạn tuổi (`gioiHanTuoi`), điểm tối thiểu (`diemMin`).
- **Sắp xếp & phân trang:** sắp xếp theo `diemTrungBinh`, `namPhatHanh`, `soDanhGia`; phân trang mặc định 8 phim theo yêu cầu đề bài.
- **Chức năng đặc thù (Chấm điểm & Bình luận):** mỗi người chỉ được đánh giá một phim một lần (409); tính điểm trung bình (1 chữ số thập phân), số đánh giá, biểu đồ thanh ngang phân bố điểm đơn giản bằng CSS, hiển thị bình luận mới nhất trước.
- **Thống kê (`/stats`):** điểm trung bình theo thể loại và top 5 phim điểm cao nhất (chỉ xét phim có ≥ 3 đánh giá).
- **Giao diện:** trang danh sách, chi tiết Server Component, form thêm/sửa có validate và hiển thị lỗi API từng trường, quản lý thể loại, thống kê, hỗ trợ giao diện màn hình nhỏ (responsive).
- **Dấu định danh:**
  - Backend chạy cổng `5019`.
  - Mọi response backend có header `X-Student-Id: N23DCPT054`.
  - Footer frontend hiển thị: `Nguyễn Thái Tuấn – N23DCPT054 – Đề 21`.
  - Có bản ghi phim chứa MSSV `N23DCPT054`.
  - Phân trang danh sách mặc định limit = 8.
- **Dữ liệu mẫu:** 4 thể loại, 10 phim, 25 đánh giá.

## Cấu trúc mã nguồn

- `backend/src/models/db.js`: khởi tạo kết nối SQLite, tạo bảng `the_loai`, `phim`, `danh_gia` với các ràng buộc khóa ngoại (foreign keys) và ràng buộc duy nhất (unique constraints).
- `backend/src/models/phim.js`: các truy vấn lấy danh sách, chi tiết, tính toán điểm trung bình và tổng hợp thống kê.
- `backend/src/controllers/api.js`: tiếp nhận request, kiểm tra dữ liệu và quy tắc nghiệp vụ, trả về mã trạng thái chuẩn REST (200, 201, 400, 404, 409).
- `backend/src/middlewares/common.js`: gắn header sinh viên `X-Student-Id`, ghi log request và middleware bắt lỗi tập trung.
- `frontend/src/`: Next.js App Router, gồm các trang `/phim`, `/phim/[id]`, `/phim/new`, `/phim/[id]/edit`, `/the-loai`, `/stats`.
