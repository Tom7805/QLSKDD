# Hợp đồng API - Module Auth & User Management

## 1. Đăng nhập hệ thống

* **URL:** `POST /api/v1/auth/login`
* **Mô tả:** Xác thực tài khoản người dùng và trả về JWT Token.
* **Request Body (JSON):**
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

* **Response thành công (200 OK):**
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
  "timestamp": "2026-08-02T00:25:45"
}
```

* **Response lỗi — sai tài khoản/mật khẩu (401 Unauthorized):**
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
  "timestamp": "2026-08-02T00:25:45"
}
```

* **Response lỗi — thiếu dữ liệu bắt buộc (400 Bad Request):**
  "timestamp": "2026-08-03T00:25:45"
}
```

### Response — 403 Forbidden (tài khoản đã bị khoá)

```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-08-02T00:25:45",
  "errors": [
    { "field": "username", "message": "Tên đăng nhập không được để trống" }
  ]
  "status": 403,
  "error": "Forbidden",
  "message": "Tài khoản đã bị khoá",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-08-03T00:25:45"
}
```

## 2. Lấy thông tin người dùng hiện tại

* **URL:** `GET /api/v1/auth/me`
* **Mô tả:** Trích xuất thông tin user dựa vào token hiện tại.
* **Headers:** `Authorization: Bearer {{token}}`

* **Response thành công (200 OK):**
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
  "timestamp": "2026-08-02T00:25:45"
}
```

* **Response lỗi — chưa đăng nhập / thiếu token (401 Unauthorized):**
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
  "timestamp": "2026-08-02T00:25:45"
}
```

## 3. Đăng xuất hệ thống

* **URL:** `POST /api/v1/auth/logout`
* **Mô tả:** Kết thúc phiên làm việc của người dùng. Do sử dụng JWT theo cơ chế *stateless*, việc hủy bỏ token thực tế do phía Client thực hiện (xóa token khỏi LocalStorage/SessionStorage). API phía Server sẽ xóa context bảo mật hiện tại.
* **Headers:** `Authorization: Bearer {{token}}`

* **Response thành công (200 OK):**

```json
{
  "success": true,
  "status": 200,
  "message": "Đã đăng xuất",
  "timestamp": "2026-08-02T00:25:45"
}
```

## 4. Các mã lỗi chuẩn (Error Codes)

| Mã | Ý nghĩa | Nguồn gốc |
|---|---|---|
| `400 Bad Request` | Dữ liệu đầu vào không hợp lệ | Vi phạm `@Valid` (`MethodArgumentNotValidException`) |
| `401 Unauthorized` | Thiếu token, token không hợp lệ/hết hạn, hoặc sai tên đăng nhập/mật khẩu | `BadCredentialsException`, `RestAuthenticationEntryPoint` |
| `403 Forbidden` | Không đủ quyền truy cập tài nguyên | `AccessDeniedException` |
| `404 Not Found` | Không tìm thấy tài nguyên | `ResourceNotFoundException` |
| `409 Conflict` | Dữ liệu trùng lặp hoặc xung đột nghiệp vụ | `DuplicateDataException`, `OverbookingException` |
| `500 Internal Server Error` | Lỗi hệ thống bất ngờ từ phía server | `Exception` (fallback) |

Mọi response lỗi đều dùng chung format `ErrorResponse`: `{ success:false, status, error, message, path, timestamp, errors? }`, trong đó `errors` chỉ xuất hiện với lỗi 400 do validate (`@Valid`), liệt kê từng trường sai.
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

## 5. Đổi mật khẩu (B1.5)

* **URL:** `PUT /api/v1/users/me/password`
* **Mô tả:** Người dùng đã đăng nhập tự đổi mật khẩu của chính mình (không phải endpoint quản trị — khác với các endpoint `/api/v1/users/**` khác vốn chỉ ADMIN gọi được).
* **Headers:** `Authorization: Bearer {{accessToken}}` (bất kỳ vai trò nào)

### Request

```json
{
  "oldPassword": "matKhauCu123",
  "newPassword": "matKhauMoi123",
  "confirmPassword": "matKhauMoi123"
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `oldPassword` | string | ✅ | Không được để trống |
| `newPassword` | string | ✅ | ≥8 ký tự, có ít nhất 1 chữ và 1 số, phải khác `oldPassword` |
| `confirmPassword` | string | ✅ | Phải trùng khớp `newPassword` |

### Response — 200 OK (thành công)

```json
{
  "success": true,
  "status": 200,
  "message": "Đổi mật khẩu thành công, vui lòng đăng nhập lại",
  "data": null,
  "timestamp": "2026-08-04T14:33:00"
}
```

FE dùng đúng `message` này làm nội dung toast (B1.5-T5), sau đó tự gọi `logout()` (không cần chờ server — JWT stateless).

### Response — 400 Bad Request (mật khẩu hiện tại sai)

```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Mật khẩu hiện tại không đúng",
  "path": "/api/v1/users/me/password",
  "timestamp": "2026-08-04T14:33:00"
}
```

Không có `errors[]` (không phải lỗi field) — FE hiển thị dạng alert chung, không gắn vào ô cụ thể.

### Response — 400 Bad Request (mật khẩu mới không hợp lệ)

```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/v1/users/me/password",
  "timestamp": "2026-08-04T14:33:00",
  "errors": [
    { "field": "newPassword", "message": "Mật khẩu mới phải có ít nhất 8 ký tự, gồm ít nhất 1 chữ và 1 số" }
  ]
}
```

Xảy ra khi: mật khẩu mới quá yếu, mật khẩu mới trùng mật khẩu cũ (lỗi gắn vào field `newPassword`), hoặc `confirmPassword` không khớp `newPassword` (lỗi gắn vào field `confirmPassword`). FE map `errors[].field` vào đúng ô input, giống cách `UserFormModal` đang xử lý lỗi 400 của form tài khoản.

### Response — 401 Unauthorized (chưa đăng nhập)

Dùng chung format `RestAuthenticationEntryPoint` như mọi endpoint khác — không cần xử lý riêng, `apiClient` interceptor đã tự bắt 401 và đăng xuất (B1.2-T6).
