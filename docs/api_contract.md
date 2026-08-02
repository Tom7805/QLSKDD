# Hợp đồng API — User Story B1.1: Đăng nhập bằng tài khoản

> Phạm vi: 2 endpoint phục vụ đăng nhập — `POST /auth/login` (`B1.1-T7`) và `GET /auth/me` (`B1.1-T8`).
> Mọi response đều bọc trong `BaseRes<T>` (thành công) hoặc `ErrorResponse` (lỗi) — xem mục 3.

## 1. Đăng nhập hệ thống

**`POST /api/v1/auth/login`**

Xác thực tài khoản bằng username/password, trả về JWT (`accessToken`, hạn 24h) kèm thông tin người dùng.

### Request

```json
{
  "username": "admin",
  "password": "admin123"
}
```

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `username` | string | ✅ | Không được để trống |
| `password` | string | ✅ | Không được để trống |

### Response — 200 OK (thành công)

```json
{
  "success": true,
  "status": 200,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Quản trị viên Hệ thống",
      "email": "admin@qlskdd.com",
      "role": "ROLE_ADMIN"
    }
  },
  "timestamp": "2026-08-03T00:25:45"
}
```

### Response — 400 Bad Request (thiếu dữ liệu bắt buộc)

```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-08-03T00:25:45",
  "errors": [
    { "field": "username", "message": "Tên đăng nhập không được để trống" }
  ]
}
```

### Response — 401 Unauthorized (sai tài khoản hoặc mật khẩu)

```json
{
  "success": false,
  "status": 401,
  "error": "Unauthorized",
  "message": "Sai tên đăng nhập hoặc mật khẩu",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-08-03T00:25:45"
}
```

### Response — 403 Forbidden (tài khoản đã bị khoá)

```json
{
  "success": false,
  "status": 403,
  "error": "Forbidden",
  "message": "Tài khoản đã bị khoá",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-08-03T00:25:45"
}
```

## 2. Lấy thông tin người dùng hiện tại

**`GET /api/v1/auth/me`**

Trích xuất thông tin người dùng từ JWT hiện tại — dùng để FE khôi phục phiên đăng nhập khi tải lại trang.

**Headers bắt buộc:** `Authorization: Bearer {{accessToken}}`

### Response — 200 OK (thành công)

```json
{
  "success": true,
  "status": 200,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "id": 1,
    "username": "admin",
    "fullName": "Quản trị viên Hệ thống",
    "email": "admin@qlskdd.com",
    "role": "ROLE_ADMIN"
  },
  "timestamp": "2026-08-03T00:25:45"
}
```

### Response — 401 Unauthorized (thiếu token / token không hợp lệ hoặc hết hạn)

```json
{
  "success": false,
  "status": 401,
  "error": "Unauthorized",
  "message": "Bạn cần đăng nhập để thực hiện thao tác này",
  "path": "/api/v1/auth/me",
  "timestamp": "2026-08-03T00:25:45"
}
```

## 3. Format response chung

| Kiểu | Dùng khi | Cấu trúc |
|---|---|---|
| `BaseRes<T>` | Thành công | `{ success:true, status, message, data, timestamp }` |
| `ErrorResponse` | Lỗi | `{ success:false, status, error, message, path, timestamp, errors? }` — `errors[]` chỉ xuất hiện khi lỗi 400 do validate (`@Valid`), liệt kê `{ field, message }` cho từng trường sai |

## 4. Mã lỗi trong phạm vi đăng nhập

| Mã | Khi nào xảy ra | Nguồn gốc (backend) |
|---|---|---|
| `400 Bad Request` | Thiếu `username`/`password` | `MethodArgumentNotValidException` |
| `401 Unauthorized` | Sai tài khoản/mật khẩu, hoặc gọi `/auth/me` mà thiếu/token không hợp lệ | `BadCredentialsException`, `RestAuthenticationEntryPoint` |
| `403 Forbidden` | Tài khoản tồn tại nhưng đã bị khoá (`enabled = false`) | `DisabledException` |
