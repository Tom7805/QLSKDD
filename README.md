# QLSKDD

## Chạy bằng Docker (một lệnh)

Không cần cài JDK, Maven hay Node — mọi thứ build trong container. Chỉ cần Docker Desktop
(Windows: `wsl --install` rồi khởi động lại máy trước).

```powershell
Copy-Item .env.example .env      # rồi sửa QLSKDD_DB_PASSWORD và QLSKDD_JWT_SECRET
docker compose up -d --build
```

| Thành phần | URL |
| --- | --- |
| Ứng dụng | http://localhost:3000 |
| API (Postman) | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:3000/swagger-ui/index.html |

Đăng nhập bằng `demo_admin` / `admin123` (dữ liệu demo được nạp sẵn).

**Biến môi trường bắt buộc** trong `.env`: `QLSKDD_DB_PASSWORD`, `QLSKDD_JWT_SECRET`.
Thiếu là compose dừng ngay với thông báo rõ ràng.

> Hướng dẫn đầy đủ — biến môi trường, lệnh vận hành, xử lý sự cố, các quyết định thiết kế và
> phần chưa làm: [docs/deployment.md](docs/deployment.md)

## Tài khoản mẫu đã seed

Khi ứng dụng chạy ở profile `dev`, hệ thống tự tạo 3 role và 3 tài khoản mặc định nếu bảng rỗng:

| Username | Mật khẩu | Vai trò |
| --- | --- | --- |
| admin | admin123 | ROLE_ADMIN |
| organizer | organizer123 | ROLE_ORGANIZER |
| user | user123 | ROLE_USER |

> Dùng để test quyền truy cập theo vai trò trong module Auth/Role.
