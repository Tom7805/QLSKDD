# QLSKDD — Hệ thống Quản lý Sự kiện và Điểm danh

## 1. Giới thiệu

**QLSKDD** là hệ thống quản lý sự kiện và điểm danh người tham gia, xây dựng theo mô hình **2 tầng (React ⇄ REST API ⇄ MySQL)**. Hệ thống cho phép:

- Quản lý **sự kiện** (tạo, sửa, cập nhật trạng thái, loại sự kiện, sức chứa).
- **Đăng ký tham gia** và quản lý **người tham gia**.
- **Điểm danh** (check-in) bằng mã vé QR và thống kê có mặt / vắng.
- **Dashboard thống kê** và **xuất báo cáo** CSV theo khoảng thời gian.
- Phân quyền theo vai trò: `ROLE_ADMIN`, `ROLE_ORGANIZER`, `ROLE_USER`.

## 2. Công nghệ sử dụng

| Tầng | Công nghệ |
| --- | --- |
| **Frontend** | React 18 · TypeScript 5.5 · Vite 5.4 · Redux Toolkit 2 · React Router 6 · Tailwind CSS 3.4 · Axios · Recharts · html5-qrcode |
| **Backend** | Java 17 · Spring Boot 3.2 · Spring Web / Data JPA / Security / Validation · JWT (jjwt) · springdoc-openapi (Swagger UI) · Lombok · ZXing (QR) |
| **Database** | MySQL 8 |
| **Test** | JUnit 5 · Spring Security Test · H2 (nhúng) — Backend / Vitest · Testing Library — Frontend |

## 3. Kiến trúc 2 tầng

```
┌──────────────────────────┐          HTTPS / REST (JSON)          ┌──────────────────────────┐
│      FRONTEND (:5173)    │  ───────────────────────────────────▶  │       BACKEND (:8080)     │
│   React + Vite + Redux   │  ◀───────────────────────────────────  │  Spring Boot + JPA + JWT  │
└──────────────────────────┘                                        └────────────┬─────────────┘
                                                                                  │ JDBC
                                                                                  ▼
                                                                       ┌──────────────────────┐
                                                                       │     MySQL (:3306)     │
                                                                       │     qlsk_dd            │
                                                                       └──────────────────────┘
```

- Frontend và Backend giao tiếp qua **REST API**, response bọc trong `BaseRes<T>` (thành công) hoặc `ErrorResponse` (lỗi).
- Xác thực bằng **JWT Bearer token** (hạn 24 giờ); API bảo vệ theo vai trò bằng Spring Security (`@PreAuthorize`) và frontend dùng `RoleRoute`/`usePermission` để ẩn chức năng theo quyền.
- Dữ liệu khởi tạo (roles, tài khoản, sự kiện mẫu) được tự động **seed** khi chạy profile `dev`.

## 4. Các module & người phụ trách

### Backend (Spring Boot)

| Module | Nội dung | Phụ trách |
| --- | --- | --- |
| Auth & Người dùng | Đăng nhập, lấy thông tin hiện tại, đổi mật khẩu, CRUD tài khoản | Nguyễn Đăng Quang |
| Sự kiện & Loại sự kiện | CRUD sự kiện, loại sự kiện, tìm kiếm/lọc | Đoàn Việt Khánh |
| Đăng ký & Người tham gia | Đăng ký/huỷ đăng ký, danh sách đăng ký, quản lý người tham gia | Nguyễn Thạc Thịnh |
| Điểm danh | Check-in bằng QR, tổng hợp có mặt/vắng | Nguyễn Đăng Quang |
| Dashboard & Báo cáo | Thống kê, xuất báo cáo CSV | Đoàn Việt Khánh |

### Frontend (React)

| Module | Nội dung | Phụ trách |
| --- | --- | --- |
| Auth, Hồ sơ, Trang chủ | Đăng nhập, hồ sơ, đổi mật khẩu, trang chủ | Phạm Trọng Hoàng Hà |
| Sự kiện | Trang chủ/lịch sự kiện, tạo/sửa/xem chi tiết | Lương Văn Sơn |
| Đăng ký, Người tham gia | Sự kiện của tôi, danh sách đăng ký, danh sách người tham gia | Lương Văn Sơn |
| Điểm danh | Trang check-in, trang có mặt/vắng | Phạm Trọng Hoàng Hà |
| Dashboard | 4 thẻ số liệu, top sự kiện, biểu đồ | Phạm Trọng Hoàng Hà |
| Người dùng, Loại sự kiện | Quản lý tài khoản, loại sự kiện | Lương Văn Sơn |

> ⚠️ **Ghi chú:** Bảng trên phân công theo vai trò BE/FE của nhóm và là **đề xuất**. Vui lòng đối chiếu và chỉnh lại theo phân công thực tế của từng thành viên.
>
> **Leader / Quản trị dự án:** Hoàng Mạnh Hùng.

## 5. Hướng dẫn cài đặt & chạy

### 5.1. Yêu cầu môi trường

| Công cụ | Phiên bản |
| --- | --- |
| JDK | 17 |
| Maven | 3.8+ (hoặc dùng wrapper `mvnw` đi kèm) |
| Node.js | 18+ |
| MySQL | 8 |

### 5.2. Các bước chạy

**Bước 1 — Chuẩn bị MySQL 8**
- Tạo database `qlsk_dd`:
  ```sql
  CREATE DATABASE IF NOT EXISTS qlsk_dd;
  ```
- Backend đọc cấu hình tại `backend/src/main/resources/application.yml`:
  - URL: `jdbc:mysql://127.0.0.1:3306/qlsk_dd`
  - Username: `root`
  - **Password đọc từ biến môi trường `DB_PASSWORD`** — cần set trước khi chạy:
    - Windows (PowerShell): `$env:DB_PASSWORD="<mật khẩu MySQL>"`
    - macOS/Linux: `export DB_PASSWORD=<mật khẩu MySQL>`
- Bảng sẽ được Hibernate **tự tạo** (`ddl-auto: update`), không cần import schema thủ công (tham khảo `docs/database_schema.sql`).

**Bước 2 — Chạy Backend (cổng 8080)**
```bash
cd backend
mvn spring-boot:run
# hoặc: ./mvnw spring-boot:run
```
- Mặc định chạy profile `dev` → tự seed 3 vai trò, 3 tài khoản mẫu và 3 sự kiện mẫu.
- API gốc: `http://localhost:8080/api/v1`

**Bước 3 — Chạy Frontend (cổng 5173)**
```bash
cd frontend
npm install
npm run dev
```
- Ứng dụng mở tại: `http://localhost:5173`
- Backend URL cấu hình ở `frontend/.env`:
  ```
  VITE_API_BASE_URL=http://localhost:8080/api/v1
  ```

### 5.3. Tóm tắt 2 cổng

| Thành phần | URL |
| --- | --- |
| Backend | http://localhost:8080 |
| Frontend | http://localhost:5173 |

## 6. Tài khoản mẫu đã seed

Khi chạy ở profile `dev`, hệ thống tự tạo 3 vai trò và 3 tài khoản mặc định (nếu bảng còn rỗng):

| Username | Mật khẩu | Vai trò |
| --- | --- | --- |
| admin | admin123 | ROLE_ADMIN |
| organizer | organizer123 | ROLE_ORGANIZER |
| user | user123 | ROLE_USER |

> Dùng để test quyền truy cập theo vai trò. `ROLE_ADMIN` quản lý toàn hệ thống; `ROLE_ORGANIZER` quản lý sự kiện/điểm danh/thống kê; `ROLE_USER` đăng ký tham gia.

## 7. Tài liệu API

- **Swagger UI** (khi Backend đang chạy): http://localhost:8080/swagger-ui.html
  - OpenAPI spec: http://localhost:8080/v3/api-docs
- **Postman Collection**: `docs/postman/QLSKDD API.postman_collection.json`
  - Vào Postman → **Import** → chọn file trên. Biến `base_url` mặc định: `http://localhost:8080/api/v1`.
- Hợp đồng API chi tiết: `docs/api_contract.md`.

## 8. Ảnh chụp các màn hình chính

> Các ảnh được chụp bằng tài khoản `admin`, lưu trong `docs/screenshots/`.

| Chức năng | Ảnh |
| --- | --- |
| Đăng nhập | ![Đăng nhập](docs/screenshots/login.PNG) |
| Danh sách sự kiện | ![Danh sách sự kiện](docs/screenshots/event-list.PNG) |
| Tạo sự kiện | ![Tạo sự kiện](docs/screenshots/create-event.PNG) |
| Danh sách đăng ký | ![Danh sách đăng ký](docs/screenshots/event-registration.PNG) |
| Điểm danh | ![Điểm danh](docs/screenshots/check-in.PNG) |
| Dashboard | ![Dashboard](docs/screenshots/dash-board.PNG) |

## Thành viên nhóm

| Vai trò | Thành viên |
| --- | --- |
| Leader / Quản trị dự án | Hoàng Mạnh Hùng |
| Backend Developer | Nguyễn Đăng Quang, Đoàn Việt Khánh, Nguyễn Thạc Thịnh, Hoàng Mạnh Hùng |
| Frontend Developer | Phạm Trọng Hoàng Hà, Lương Văn Sơn |

