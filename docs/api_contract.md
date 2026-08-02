# Hợp đồng API - Module Auth & User Management

## 1. Đăng nhập hệ thống

* **URL:** `POST /api/v1/auth/login`
* **Mô tả:** Xác thực tài khoản người dùng và trả về JWT Token.
* **Request Body (JSON):**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

* **Response thành công (200 OK):**

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
}
```

## 2. Lấy thông tin người dùng hiện tại

* **URL:** `GET /api/v1/auth/me`
* **Mô tả:** Trích xuất thông tin user dựa vào token hiện tại.
* **Headers:** `Authorization: Bearer {{token}}`

* **Response thành công (200 OK):**

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
