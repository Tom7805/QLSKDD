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

## 6. Quản lý loại sự kiện (B2.1)

* **Đọc** (`GET`): công khai, không cần đăng nhập (`permitAll`).
* **Ghi** (`POST` / `PUT` / `DELETE`): chỉ **ADMIN**, người khác gọi nhận `403`.

### `GET /api/v1/categories` — Danh sách loại sự kiện

Không phân trang (số lượng loại sự kiện luôn nhỏ). Mỗi phần tử kèm `eventCount` — số sự kiện đang thuộc loại đó, tính bằng 1 truy vấn group-by ở service (không N+1).

**Response — 200 OK**
```json
{
  "success": true,
  "status": 200,
  "message": "Lấy danh sách loại sự kiện thành công",
  "data": [
    { "id": 1, "name": "Hội thảo", "description": "Các sự kiện hội thảo, chia sẻ kiến thức", "eventCount": 3 },
    { "id": 2, "name": "Workshop", "description": null, "eventCount": 0 }
  ],
  "timestamp": "2026-08-05T00:00:00"
}
```

### `GET /api/v1/categories/{id}` — Chi tiết 1 loại sự kiện

**Response — 200 OK**
```json
{
  "success": true,
  "status": 200,
  "message": "Lấy loại sự kiện thành công",
  "data": { "id": 1, "name": "Hội thảo", "description": "Các sự kiện hội thảo, chia sẻ kiến thức", "eventCount": 3 },
  "timestamp": "2026-08-05T00:00:00"
}
```

**Response — 404 Not Found** (id không tồn tại)
```json
{
  "success": false,
  "status": 404,
  "error": "Not Found",
  "message": "Loại sự kiện không tồn tại với id = '999'",
  "path": "/api/v1/categories/999",
  "timestamp": "2026-08-05T00:00:00"
}
```

### `POST /api/v1/categories` — Tạo loại sự kiện (ADMIN)

**Headers:** `Authorization: Bearer {{accessToken}}` (role ADMIN)

**Request**
```json
{
  "name": "Hội thảo",
  "description": "Các sự kiện hội thảo, chia sẻ kiến thức"
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `name` | string | ✅ | Không trống, tối đa 100 ký tự, không được trùng tên (không phân biệt hoa/thường) |
| `description` | string | ❌ | Tự do |

**Response — 201 Created**
```json
{
  "success": true,
  "status": 201,
  "message": "Tạo loại sự kiện thành công",
  "data": { "id": 3, "name": "Hội thảo", "description": "Các sự kiện hội thảo, chia sẻ kiến thức", "eventCount": 0 },
  "timestamp": "2026-08-05T00:00:00"
}
```

**Response — 409 Conflict** (trùng tên, không phân biệt hoa thường)
```json
{
  "success": false,
  "status": 409,
  "error": "Conflict",
  "message": "Tên loại sự kiện đã tồn tại",
  "path": "/api/v1/categories",
  "timestamp": "2026-08-05T00:00:00"
}
```

**Response — 400 Bad Request** (thiếu `name`)
```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/v1/categories",
  "timestamp": "2026-08-05T00:00:00",
  "errors": [
    { "field": "name", "message": "Tên loại sự kiện không được để trống" }
  ]
}
```

**Response — 403 Forbidden** (không phải ADMIN)
```json
{
  "success": false,
  "status": 403,
  "error": "Forbidden",
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "path": "/api/v1/categories",
  "timestamp": "2026-08-05T00:00:00"
}
```

### `PUT /api/v1/categories/{id}` — Sửa loại sự kiện (ADMIN)

Body giống `POST`. Khi kiểm tra trùng tên sẽ **bỏ qua chính bản ghi đang sửa**. Response 200 OK trả `CategoryRes` sau khi cập nhật, cùng mã lỗi 400/404/409/403 như trên.

### `DELETE /api/v1/categories/{id}` — Xoá loại sự kiện (ADMIN)

**Response — 200 OK**
```json
{
  "success": true,
  "status": 200,
  "message": "Xoá loại sự kiện thành công",
  "timestamp": "2026-08-05T00:00:00"
}
```

**Response — 409 Conflict** (đang còn sự kiện thuộc loại này)
```json
{
  "success": false,
  "status": 409,
  "error": "Conflict",
  "message": "Không thể xoá: đang có 3 sự kiện thuộc loại này",
  "path": "/api/v1/categories/1",
  "timestamp": "2026-08-05T00:00:00"
}
```

FE hiển thị đúng nguyên văn `message` này (đã có sẵn số lượng) khi bắt lỗi 409 lúc xoá.

## 7. Tạo sự kiện (B2.2)

* **URL:** `POST /api/v1/events`
* **Headers:** `Authorization: Bearer {{accessToken}}` (role **ADMIN** hoặc **ORGANIZER**, người khác nhận `403`)

### Request
```json
{
  "name": "Hội thảo Trí tuệ nhân tạo 2026",
  "description": "Chia sẻ kiến thức AI cho sinh viên",
  "location": "Hội trường A",
  "capacity": 100,
  "startAt": "2026-09-01T08:00:00",
  "endAt": "2026-09-01T11:00:00",
  "categoryId": 1
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `name` | string | ✅ | Không trống, tối đa 255 ký tự |
| `description` | string | ❌ | Tự do |
| `location` | string | ✅ | Không trống |
| `capacity` | number | ✅ | Số nguyên dương (>0) |
| `startAt` | datetime ISO (`yyyy-MM-ddTHH:mm:ss`) | ✅ | Phải ở tương lai |
| `endAt` | datetime ISO | ✅ | Phải sau `startAt` |
| `categoryId` | number | ✅ | Phải tồn tại (lấy từ `GET /categories`) |

`status` **không** nằm trong request — sự kiện mới tạo luôn mặc định `OPEN`. `createdBy` cũng không nhận từ client — backend tự lấy từ token.

### Response — 201 Created
```json
{
  "success": true,
  "status": 201,
  "message": "Tạo sự kiện thành công",
  "data": {
    "id": 5,
    "name": "Hội thảo Trí tuệ nhân tạo 2026",
    "description": "Chia sẻ kiến thức AI cho sinh viên",
    "location": "Hội trường A",
    "capacity": 100,
    "startAt": "2026-09-01T08:00:00",
    "endAt": "2026-09-01T11:00:00",
    "status": "OPEN",
    "categoryId": 1,
    "categoryName": "Hội thảo",
    "createdBy": "organizer",
    "createdAt": "2026-08-05T00:00:00"
  },
  "timestamp": "2026-08-05T00:00:00"
}
```

FE dùng `data` này để điều hướng thẳng sang trang chi tiết sự kiện vừa tạo (không cần gọi lại `GET /events/{id}`).

### Response — 400 Bad Request (thiếu trường / sai định dạng)
```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/v1/events",
  "timestamp": "2026-08-05T00:00:00",
  "errors": [
    { "field": "name", "message": "Tên sự kiện không được để trống" },
    { "field": "capacity", "message": "Sức chứa phải lớn hơn 0" }
  ]
}
```

### Response — 400 Bad Request (endAt trước hoặc bằng startAt)
```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/v1/events",
  "timestamp": "2026-08-05T00:00:00",
  "errors": [
    { "field": "endAt", "message": "Thời gian kết thúc phải sau thời gian bắt đầu" }
  ]
}
```

### Response — 404 Not Found (`categoryId` không tồn tại)
```json
{
  "success": false,
  "status": 404,
  "error": "Not Found",
  "message": "Loại sự kiện không tồn tại với id = '999'",
  "path": "/api/v1/events",
  "timestamp": "2026-08-05T00:00:00"
}
```

### Response — 403 Forbidden (không phải ADMIN/ORGANIZER)
```json
{
  "success": false,
  "status": 403,
  "error": "Forbidden",
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "path": "/api/v1/events",
  "timestamp": "2026-08-05T00:00:00"
}
```

## 8. Sửa thông tin sự kiện (B2.3)

* **URL:** `PUT /api/v1/events/{id}`
* **Headers:** `Authorization: Bearer {{accessToken}}`
* **Quyền:** ADMIN sửa được **mọi** sự kiện. ORGANIZER **chỉ sửa được sự kiện do chính mình tạo** — sửa sự kiện của người khác nhận `403`. USER nhận `403` với mọi sự kiện.

### Request

Y hệt body của `POST /api/v1/events` (dùng lại toàn bộ validate: `name/location/capacity/startAt/endAt/categoryId`, `endAt` phải sau `startAt`).
```json
{
  "name": "Hội thảo Trí tuệ nhân tạo 2026 (đã sửa)",
  "description": "Cập nhật lại nội dung mô tả",
  "location": "Hội trường B",
  "capacity": 150,
  "startAt": "2026-09-01T08:00:00",
  "endAt": "2026-09-01T12:00:00",
  "categoryId": 1
}
```

### Response — 200 OK
```json
{
  "success": true,
  "status": 200,
  "message": "Cập nhật sự kiện thành công",
  "data": {
    "id": 1,
    "name": "Hội thảo Trí tuệ nhân tạo 2026 (đã sửa)",
    "description": "Cập nhật lại nội dung mô tả",
    "location": "Hội trường B",
    "capacity": 150,
    "startAt": "2026-09-01T08:00:00",
    "endAt": "2026-09-01T12:00:00",
    "status": "OPEN",
    "categoryId": 1,
    "categoryName": "Hội thảo",
    "createdBy": "organizer",
    "createdAt": "2026-08-02T00:00:00"
  },
  "timestamp": "2026-08-05T00:00:00"
}
```

### Response — 404 Not Found (`id` sự kiện không tồn tại)
```json
{
  "success": false,
  "status": 404,
  "error": "Not Found",
  "message": "Sự kiện không tồn tại với id = '999'",
  "path": "/api/v1/events/999",
  "timestamp": "2026-08-05T00:00:00"
}
```

### Response — 409 Conflict (hạ `capacity` xuống dưới số người đã đăng ký)
```json
{
  "success": false,
  "status": 409,
  "error": "Conflict",
  "message": "Sức chứa không thể nhỏ hơn số người đã đăng ký (10)",
  "path": "/api/v1/events/1",
  "timestamp": "2026-08-05T00:00:00"
}
```

FE hiển thị nguyên văn `message` này (đã có sẵn số lượng) làm alert đỏ ngay trên ô `capacity`.

### Response — 400 Bad Request

Cùng format với lỗi validate của `POST /events` (thiếu trường, `capacity ≤ 0`, `endAt` không sau `startAt`) — xem mục 7.

### Response — 403 Forbidden (ORGANIZER sửa sự kiện không phải của mình)
```json
{
  "success": false,
  "status": 403,
  "error": "Forbidden",
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "path": "/api/v1/events/1",
  "timestamp": "2026-08-05T00:00:00"
}
```

## 9. Đóng / huỷ sự kiện (B2.4)

* **URL:** `PATCH /api/v1/events/{id}/status`
* **Headers:** `Authorization: Bearer {{accessToken}}`
* **Quyền:** giống hệt `PUT /events/{id}` — ADMIN đổi được trạng thái **mọi** sự kiện; ORGANIZER chỉ đổi được sự kiện do chính mình tạo (403 nếu không phải chủ).

### Request

Chỉ 1 trường `status`, nhận 1 trong 3 giá trị: `OPEN`, `CLOSED`, `CANCELLED`.
```json
{
  "status": "CLOSED"
}
```

**Các cặp chuyển trạng thái được phép** — chuyển ngoài 3 cặp này (kể cả giữ nguyên trạng thái hiện tại) đều bị từ chối:

| Từ | Sang |
|---|---|
| `OPEN` | `CLOSED` |
| `OPEN` | `CANCELLED` |
| `CLOSED` | `OPEN` |

### Response — 200 OK
```json
{
  "success": true,
  "status": 200,
  "message": "Cập nhật trạng thái sự kiện thành công",
  "data": {
    "id": 1,
    "name": "Hội thảo Trí tuệ nhân tạo 2026",
    "description": "...",
    "location": "Hội trường A",
    "capacity": 100,
    "startAt": "2026-09-01T08:00:00",
    "endAt": "2026-09-01T11:00:00",
    "status": "CLOSED",
    "categoryId": 1,
    "categoryName": "Hội thảo",
    "createdBy": "organizer",
    "createdAt": "2026-08-02T00:00:00"
  },
  "timestamp": "2026-08-05T00:00:00"
}
```

### Response — 400 Bad Request (chuyển trạng thái không hợp lệ, vd `CANCELLED` → `OPEN`)
```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Không thể chuyển trạng thái này",
  "path": "/api/v1/events/1/status",
  "timestamp": "2026-08-05T00:00:00"
}
```

### Response — 404 Not Found / 403 Forbidden

Giống hệt `PUT /events/{id}` — xem mục 8.

### Ảnh hưởng tới đăng ký (B2.4-T2)

Khi sự kiện **không còn `OPEN`** (đã `CLOSED` hoặc `CANCELLED`), mọi lượt đăng ký mới đều bị chặn ở tầng service với lỗi:
```json
{
  "success": false,
  "status": 409,
  "error": "Conflict",
  "message": "Sự kiện đã đóng đăng ký",
  "errorCode": "EVENT_CLOSED",
  "path": "/api/v1/registrations",
  "timestamp": "2026-08-05T00:00:00"
}
```

> API `POST /api/v1/registrations` đã triển khai đầy đủ ở **B3.1 (Đăng ký tham gia sự kiện)** — xem mục 11 bên dưới để có request/response mẫu và toàn bộ mã lỗi.

## 10. Xem danh sách & chi tiết sự kiện (B2.5)

* **Quyền:** công khai, không cần đăng nhập (`permitAll`) — giống mọi `GET /events/**`.

### `GET /api/v1/events` — Danh sách sự kiện có phân trang

**Query params:** `page` (mặc định `0`), `size` (mặc định `10`). Mặc định sắp xếp theo `startAt` tăng dần (sự kiện sắp diễn ra lên đầu) — không cần truyền tham số `sort`.

**Response — 200 OK**
```json
{
  "success": true,
  "status": 200,
  "message": "Lấy danh sách sự kiện thành công",
  "data": {
    "content": [
      {
        "id": 1,
        "name": "Hội thảo Trí tuệ nhân tạo 2026",
        "location": "Hội trường A",
        "startAt": "2026-09-01T08:00:00",
        "endAt": "2026-09-01T11:00:00",
        "status": "OPEN",
        "capacity": 100,
        "availableSeats": 65
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 25,
    "totalPages": 3,
    "last": false
  },
  "timestamp": "2026-08-05T00:00:00"
}
```

`availableSeats = capacity - (số lượt đăng ký ACTIVE)`, tính bằng **1 truy vấn group-by duy nhất cho cả trang** (không N+1). Với sự kiện chưa có `capacity` (dữ liệu mẫu cũ), cả `capacity` và `availableSeats` trả về `null` — FE nên ẩn dòng "còn X/Y chỗ" khi gặp `null`.

### `GET /api/v1/events/{id}` — Chi tiết 1 sự kiện

**Response — 200 OK**
```json
{
  "success": true,
  "status": 200,
  "message": "Lấy chi tiết sự kiện thành công",
  "data": {
    "id": 1,
    "name": "Hội thảo Trí tuệ nhân tạo 2026",
    "description": "Chia sẻ kiến thức AI cho sinh viên",
    "location": "Hội trường A",
    "capacity": 100,
    "startAt": "2026-09-01T08:00:00",
    "endAt": "2026-09-01T11:00:00",
    "status": "OPEN",
    "categoryId": 1,
    "categoryName": "Hội thảo",
    "createdBy": "organizer",
    "createdAt": "2026-08-02T00:00:00",
    "totalRegistered": 35,
    "availableSeats": 65
  },
  "timestamp": "2026-08-05T00:00:00"
}
```

**Response — 404 Not Found** (id không tồn tại)
```json
{
  "success": false,
  "status": 404,
  "error": "Not Found",
  "message": "Sự kiện không tồn tại với id = '999'",
  "path": "/api/v1/events/999",
  "timestamp": "2026-08-05T00:00:00"
}
```

## 11. Đăng ký tham gia sự kiện (B3.1)

* **URL:** `POST /api/v1/registrations`
* **Headers:** `Authorization: Bearer {{accessToken}}` — bất kỳ ai đã đăng nhập (ADMIN/ORGANIZER/USER) đều đăng ký được, không giới hạn vai trò.
* **Quan trọng:** người đăng ký lấy từ token, **client không được gửi `userId`**.

### Request
```json
{
  "eventId": 1
}
```

### Response — 201 Created (thành công)
```json
{
  "success": true,
  "status": 201,
  "message": "Đăng ký thành công",
  "data": {
    "registrationId": 15,
    "code": "3f2a9c1e-...-...",
    "eventName": "Hội thảo Trí tuệ nhân tạo 2026"
  },
  "timestamp": "2026-08-05T00:00:00"
}
```

FE dùng `data.code` hiển thị "Mã vé của bạn: XXXX" trong toast/dialog thành công (B3.1-T8).

### Các nhánh lỗi — phân biệt bằng `errorCode`, không parse `message`

| `errorCode` | HTTP | Khi nào xảy ra | `message` |
|---|---|---|---|
| `EVENT_CLOSED` | 409 | Sự kiện đang `CLOSED` hoặc `CANCELLED` (không `OPEN`) | "Sự kiện đã đóng đăng ký" |
| (không có, dùng chung `BusinessException`) | 409 | `endAt` của sự kiện đã qua | "Sự kiện đã diễn ra" |
| `DUPLICATE_REGISTRATION` | 409 | Đã có lượt đăng ký `ACTIVE` cho chính sự kiện này | "Bạn đã đăng ký sự kiện này" |
| `OVERBOOKING` | 409 | Số đăng ký `ACTIVE` đã bằng `capacity` | "Sự kiện đã hết chỗ" |
| — | 404 | `eventId` không tồn tại | "Sự kiện không tồn tại với id = '999'" |
| — | 400 | Thiếu `eventId` trong body | "Dữ liệu không hợp lệ" kèm `errors: [{field:"eventId", message:"Sự kiện không được để trống"}]` |

**Mẫu response lỗi OVERBOOKING:**
```json
{
  "success": false,
  "status": 409,
  "error": "Conflict",
  "message": "Sự kiện đã hết chỗ",
  "errorCode": "OVERBOOKING",
  "path": "/api/v1/registrations",
  "timestamp": "2026-08-05T00:00:00"
}
```

**Mẫu response lỗi DUPLICATE_REGISTRATION:**
```json
{
  "success": false,
  "status": 409,
  "error": "Conflict",
  "message": "Bạn đã đăng ký sự kiện này",
  "errorCode": "DUPLICATE_REGISTRATION",
  "path": "/api/v1/registrations",
  "timestamp": "2026-08-05T00:00:00"
}
```

FE bắt `errorCode` (không phải parse chuỗi `message`) để hiển thị đúng thông điệp theo B3.1-T8:
- `OVERBOOKING` → `"Sự kiện đã hết chỗ"`
- `DUPLICATE_REGISTRATION` → `"Bạn đã đăng ký sự kiện này"`
- 401 (chưa đăng nhập) → dialog gợi ý chuyển sang trang đăng nhập.

## 12. Danh sách đăng ký của tôi (B3.2-T5)

* **URL:** `GET /api/v1/registrations/me?page=0&size=10`
* **Headers:** `Authorization: Bearer {{accessToken}}` — bất kỳ ai đã đăng nhập, chỉ trả về lượt đăng ký của **chính người gọi** (lấy từ token, không nhận `userId`/`username` qua query).
* Sắp xếp mặc định: `registeredAt` giảm dần (đăng ký gần nhất lên trước).
* Đây là API còn thiếu khiến FE không dựng được trang **"Sự kiện của tôi"** (B3.2-T5/T6/T7) — trước đó backend mới chỉ có `POST /registrations` và `DELETE /registrations/{id}`.

### Response — 200 OK
```json
{
  "success": true,
  "status": 200,
  "message": "Lấy danh sách đăng ký của tôi thành công",
  "data": {
    "content": [
      {
        "registrationId": 15,
        "code": "3f2a9c1e-...-...",
        "registrationStatus": "ACTIVE",
        "registeredAt": "2026-08-05T10:00:00",
        "eventId": 1,
        "eventName": "Hội thảo Trí tuệ nhân tạo 2026",
        "location": "Hội trường A",
        "startAt": "2026-08-20T08:00:00",
        "endAt": "2026-08-20T11:00:00",
        "eventStatus": "OPEN",
        "canCancel": true
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  },
  "timestamp": "2026-08-07T00:00:00"
}
```

* `registrationStatus`: `ACTIVE` | `CANCELLED`.
* `eventStatus`: `OPEN` | `CLOSED` | `CANCELLED` (dùng để tô màu badge, giống danh sách/chi tiết sự kiện).
* **`canCancel`**: backend tự tính sẵn theo đúng luật đang áp dụng ở `DELETE /registrations/{id}` (còn `ACTIVE` và sự kiện chưa `startAt`) — FE chỉ cần dựa vào cờ này để ẩn/hiện nút Huỷ, **không tự suy luận lại**.
  > Lưu ý: `canCancel` **chưa** tính điều kiện "đã điểm danh" vì B4.1 (điểm danh) chưa được triển khai trong code hiện tại. Khi B4.1 xong, backend sẽ cập nhật lại giá trị này — FE không cần đổi gì thêm vì vẫn đọc cùng field `canCancel`.

## 13. Huỷ đăng ký (B3.2)

* **URL:** `DELETE /api/v1/registrations/{id}`
* **Headers:** `Authorization: Bearer {{accessToken}}`
* **Quyền:** chỉ **chính chủ** lượt đăng ký (`{id}`) hoặc **ADMIN** được huỷ. Người dùng khác gọi nhận `403` (không phân biệt id tồn tại hay không — cùng cách xử lý với `PUT /events/{id}`, xem mục 8).
* **Không xoá bản ghi** — chỉ đổi `status` sang `CANCELLED`, giữ lại lịch sử.
* `{id}` ở đây là `registrationId` (trả về trong `data.registrationId` lúc đăng ký ở mục 11), **không phải** `eventId`.

### Request

Không có body.

### Response — 200 OK (thành công)
```json
{
  "success": true,
  "status": 200,
  "message": "Đã huỷ đăng ký",
  "timestamp": "2026-08-06T10:00:00"
}
```

Sau khi huỷ, `availableSeats` của sự kiện đó tự tăng lại ngay ở lần gọi `GET /events/{id}` hoặc `GET /events` tiếp theo — vì mọi truy vấn đếm chỗ chỉ tính `status = ACTIVE` (không cần FE tự cộng thủ công).

### Response — 404 Not Found (`id` không tồn tại)
```json
{
  "success": false,
  "status": 404,
  "error": "Not Found",
  "message": "Lượt đăng ký không tồn tại với id = '999'",
  "path": "/api/v1/registrations/999",
  "timestamp": "2026-08-06T10:00:00"
}
```

### Response — 409 Conflict (sự kiện đã bắt đầu)
```json
{
  "success": false,
  "status": 409,
  "error": "Conflict",
  "message": "Sự kiện đã bắt đầu, không thể huỷ đăng ký",
  "path": "/api/v1/registrations/15",
  "timestamp": "2026-08-06T10:00:00"
}
```

### Response — 409 Conflict (đã huỷ trước đó — gọi lại lần 2)
```json
{
  "success": false,
  "status": 409,
  "error": "Conflict",
  "message": "Lượt đăng ký này đã được huỷ trước đó",
  "path": "/api/v1/registrations/15",
  "timestamp": "2026-08-06T10:00:00"
}
```

### Response — 403 Forbidden (huỷ đăng ký của người khác)
```json
{
  "success": false,
  "status": 403,
  "error": "Forbidden",
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "path": "/api/v1/registrations/15",
  "timestamp": "2026-08-06T10:00:00"
}
```

> **Lưu ý còn thiếu (chặn B4.1):** tiêu chí "chặn huỷ khi đã điểm danh" trong user story B3.2 **chưa được kiểm tra** ở bản này, vì tính năng điểm danh (B4.1 — `CheckInHistory`/`CheckInHistoryRepository`) chưa được triển khai trong code (file hiện đang rỗng). Khi B4.1 xong, cần thêm đúng 1 điều kiện vào `RegistrationServiceImpl.cancel()`: nếu `checkInHistoryRepository.existsByRegistrationId(id)` → ném `BusinessException(CONFLICT, "Lượt đăng ký đã được điểm danh, không thể huỷ")`.
