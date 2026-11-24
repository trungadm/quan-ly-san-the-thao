# Quản lý sân thể thao — phần quản lý dữ liệu nền

Ứng dụng React + Vite dành cho phần được phân công: sân, loại sân, khung giờ, khách hàng và tài khoản người dùng.

## Yêu cầu
- Đã cài Node.js (khuyến nghị bản LTS).
- Có VS Code hoặc trình soạn thảo tương tự.

## Cách chạy trên Windows
1. Giải nén thư mục `quan_ly_san_the_thao`.
2. Mở thư mục đó bằng VS Code.
3. Mở Terminal trong VS Code.
4. Chạy lần lượt:

```bash
npm install
npm run dev
```

5. Mở địa chỉ Local mà Vite in ra trong Terminal (thường là `http://localhost:5173`).

Nếu PowerShell chặn lệnh `npm`, thử chạy `npm.cmd install` và `npm.cmd run dev`.

## Chức năng hiện có
- Dashboard thống kê số sân, loại sân, khách hàng, khung giờ.
- CRUD sân, loại sân, khung giờ, khách hàng, tài khoản.
- Tìm kiếm theo nội dung đang hiển thị.
- Chọn trạng thái sân.
- Xem chi tiết khách hàng.
- Kiểm tra trùng tên loại sân, số điện thoại khách hàng, tên đăng nhập và khung giờ chồng lấn.
- Xác nhận trước khi xóa.
- Lưu dữ liệu bằng MySQL thông qua backend Express.

## Dữ liệu và backend
Sân, loại sân, khung giờ, khách hàng và tài khoản đều được tải và cập nhật bằng API Express/MySQL tại `http://localhost:5000/api`.

Để chạy đầy đủ:
1. Đảm bảo MySQL đang chạy và database `sportiva` có các bảng `fields`, `field_types`, `time_slots`, `customers`.
2. Đặt biến `DB_PASSWORD` trong file `.env` ở thư mục dự án hoặc thư mục cha.
3. Chạy nội dung file `database.sql` trong database `sportiva` để tạo bảng `users`.
4. Chạy `seed-users.sql` nếu cần thêm 50 tài khoản nhân viên mẫu.
5. Mở terminal thứ nhất tại thư mục dự án và chạy `node server.cjs`.
6. Mở terminal thứ hai tại thư mục dự án và chạy `npm run dev`.

Backend tự tìm file `.env` ở thư mục dự án và thư mục cha. `src/api.js` gọi API để tải, thêm, sửa và xóa dữ liệu.

## Các file chính
- `src/App.jsx`: giao diện và các chức năng.
- `src/api.js`: các lời gọi API đến backend.
- `database.sql`: tạo bảng tài khoản người dùng.
- `src/styles.css`: giao diện responsive.
- `src/main.jsx`: điểm khởi chạy React.
