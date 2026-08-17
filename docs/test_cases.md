# QLSKDD — Kịch bản kiểm thử tích hợp (B6.2)

> Tài liệu này là sản phẩm của **`B6.2-T1`** (viết kịch bản kiểm thử luồng chính) và là nơi ghi
> kết quả của **`B6.2-T2`** (kiểm thử chéo module), **`B6.2-T3`** (sửa lỗi), **`B6.2-T4`** (kiểm thử hồi quy).
>
> Cột **Kết quả thực tế** để trống — người kiểm thử điền `PASS` / `FAIL + mã phiếu lỗi` khi chạy.

---

## Nội dung

| | |
|---|---|
| [0. Chuẩn bị môi trường](#0-chuẩn-bị-môi-trường) | [5. Điểm danh](#5-điểm-danh--m4) |
| [1. Luồng chính xuyên suốt](#1-luồng-chính-xuyên-suốt-integration) | [6. Thống kê & báo cáo](#6-thống-kê--báo-cáo--m5) |
| [2. Xác thực & phân quyền](#2-xác-thực--phân-quyền--m1) | [7. Responsive & đa trình duyệt](#7-responsive--đa-trình-duyệt) |
| [3. Loại sự kiện & sự kiện](#3-loại-sự-kiện--sự-kiện--m2) | [8. Kiểm thử tự động](#8-kiểm-thử-tự-động-hồi-quy-máy) |
| [4. Đăng ký tham dự](#4-đăng-ký-tham-dự--m3) | [9. Phiếu lỗi & hồi quy cuối](#9-phiếu-lỗi--hồi-quy-cuối) |

---

## 0. Chuẩn bị môi trường

### 0.1. Trước mỗi lượt kiểm thử

| Bước | Việc làm |
|---|---|
| 1 | `DROP DATABASE qlsk_dd;` rồi `CREATE DATABASE qlsk_dd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` |
| 2 | Set `DB_PASSWORD` rồi chạy backend: `cd backend && ./mvnw spring-boot:run` |
| 3 | Kiểm tra log có dòng `Đã nạp dữ liệu mẫu: 3 tài khoản mẫu (admin/organizer/user)` và `Đã nạp dữ liệu mẫu: 3 Events` |
| 4 | Chạy frontend: `cd frontend && npm run dev` → mở `http://localhost:5173` |
| 5 | Xoá `localStorage` của trình duyệt (F12 → Application → Clear site data) để không dùng token của lượt trước |

### 0.2. Tài khoản dùng để kiểm thử

| Username | Mật khẩu | Vai trò |
|---|---|---|
| `admin` | `admin123` | `ROLE_ADMIN` |
| `organizer` | `organizer123` | `ROLE_ORGANIZER` |
| `user` | `user123` | `ROLE_USER` |

### 0.3. Lưu ý về dữ liệu seed

> [!IMPORTANT]
> 3 sự kiện mẫu do `DataSeeder` tạo **không có `capacity` và không có loại sự kiện** (cố ý, xem chú thích ở `Event.java`).
> Vì vậy **không thể** dùng chúng để kiểm thử chặn hết chỗ (`TC-REG-03`) hay lọc theo loại (`TC-EVT-07`) —
> phải tự tạo sự kiện mới có `capacity` nhỏ và có gắn loại. Các ca kiểm thử dưới đây đã ghi rõ điều này.

---

## 1. Luồng chính xuyên suốt (Integration)

Đây là luồng bắt buộc của `B6.2-T1`: **đăng nhập → tạo loại → tạo sự kiện → user đăng ký → organizer xem danh sách → điểm danh → xem thống kê.**
Chạy **liên tục từ đầu đến cuối, không reset DB ở giữa** — mỗi ca dùng dữ liệu do ca trước sinh ra.

| Mã ca | Các bước | Dữ liệu | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|
| `TC-INT-01` | Đăng nhập bằng `admin` | `admin` / `admin123` | Vào được trang chủ; Sidebar hiện đủ mục quản trị (Người dùng, Loại sự kiện, Dashboard); Topbar hiện tên tài khoản | |
| `TC-INT-02` | Vào **Loại sự kiện** → Thêm mới | Tên: `Hội thảo`, mô tả: `Sự kiện chuyên đề` | Toast thành công; loại mới xuất hiện trong bảng với `số sự kiện = 0` | |
| `TC-INT-03` | Đăng xuất `admin`, đăng nhập `organizer` | `organizer` / `organizer123` | Sidebar **không** còn mục Người dùng / Loại sự kiện; vẫn có Sự kiện, Dashboard | |
| `TC-INT-04` | Vào **Sự kiện** → Tạo sự kiện | Tên: `Workshop kiểm thử`, địa điểm: `Phòng 101`, **sức chứa: `2`**, loại: `Hội thảo`, bắt đầu: hôm nay + 2 ngày 09:00, kết thúc: cùng ngày 11:00 | HTTP 201; chuyển sang trang chi tiết; badge trạng thái `Đang mở`; hiển thị `còn 2/2 chỗ` | |
| `TC-INT-05` | Quay lại **Loại sự kiện** bằng `admin` | — | Loại `Hội thảo` giờ hiển thị `số sự kiện = 1` (đối chiếu chéo module M2 ↔ M2.1) | |
| `TC-INT-06` | Đăng nhập `user` → mở `Workshop kiểm thử` → bấm **Đăng ký** | — | Toast `Đăng ký thành công` kèm mã vé 8 ký tự; nút đổi thành `Đã đăng ký`; số chỗ còn giảm về `còn 1/2 chỗ` | |
| `TC-INT-07` | Vào **Sự kiện của tôi** → mở vé QR | — | Modal hiện ảnh QR + mã chữ; mã trùng khớp mã ở `TC-INT-06`; nút tải ảnh / sao chép mã hoạt động | |
| `TC-INT-08` | Đăng nhập `organizer` → mở sự kiện → **Xem người đăng ký** | — | Bảng có đúng 1 dòng là `user`; thanh tiến độ hiện `Đã đăng ký: 1 / 2` | |
| `TC-INT-09` | Vào **Điểm danh** của sự kiện → bấm `Điểm danh` ở dòng của `user` | — | Toast xanh `Điểm danh thành công — <họ tên>`; badge dòng đó đổi sang `Đã đến + giờ`; **trang không nhảy về đầu danh sách** | |
| `TC-INT-10` | Bấm `Điểm danh` lần thứ hai cho cùng người đó | — | Toast vàng `Người này đã điểm danh lúc HH:mm`; **không sinh thêm bản ghi** (kiểm tra bằng SQL: `SELECT COUNT(*) FROM check_in_history` không tăng) | |
| `TC-INT-11` | Vào trang **Có mặt / Vắng mặt** của sự kiện | — | 3 thẻ số liệu: `Tổng đăng ký = 1`, `Có mặt = 1`, `Vắng = 0`; tỷ lệ `100.0%`; đối chiếu `present + absent == totalRegistered` | |
| `TC-INT-12` | Vào **Dashboard** | — | Số liệu khớp: tổng sự kiện = `4` (3 seed + 1 mới), tổng lượt đăng ký ≥ 1, tổng điểm danh ≥ 1; bảng Top sự kiện có `Workshop kiểm thử` | |
| `TC-INT-13` | Ở Dashboard → **Xuất báo cáo CSV** với khoảng thời gian phủ sự kiện vừa tạo | từ: đầu tháng, đến: cuối tháng | File `bao-cao.csv` tải về; mở bằng Excel **không lỗi font tiếng Việt**; dòng của `Workshop kiểm thử` có `tổng đăng ký = 1`, `có mặt = 1`, `tỷ lệ = 100.0` | |
| `TC-INT-14` | Đăng nhập `user` → **Sự kiện của tôi** → bấm Huỷ đăng ký sự kiện đã điểm danh | — | HTTP 409 `Lượt đăng ký đã được điểm danh, không thể huỷ`; nút Huỷ nên đã bị ẩn từ trước ở giao diện | |

---

## 2. Xác thực & phân quyền — M1

| Mã ca | Các bước | Dữ liệu | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|
| `TC-AUTH-01` | Submit form đăng nhập khi để trống cả 2 ô | — | Không gọi API; hiện lỗi bắt buộc dưới từng ô; viền ô đổi đỏ | |
| `TC-AUTH-02` | Đăng nhập sai mật khẩu | `admin` / `sai123456` | HTTP 401; alert đỏ `Sai tên đăng nhập hoặc mật khẩu` | |
| `TC-AUTH-03` | Đăng nhập bằng username không tồn tại | `khongtontai` / `123456` | HTTP 401, **cùng một câu thông báo** như `TC-AUTH-02` (không tiết lộ username có tồn tại hay không) | |
| `TC-AUTH-04` | `admin` khoá tài khoản `user`, rồi thử đăng nhập bằng `user` | — | Đăng nhập bị từ chối với `Tài khoản đã bị khoá`; mở khoá lại sau khi test | |
| `TC-AUTH-05` | Đang đăng nhập → F5 tải lại trang | — | Vẫn giữ phiên (đọc lại token và gọi `GET /auth/me`), **không bị đẩy về `/login`** | |
| `TC-AUTH-06` | Sửa token trong `localStorage` thành chuỗi rác → F5 | — | Bị đẩy về `/login` kèm toast; không hiện trang trắng hay lỗi 500 | |
| `TC-AUTH-07` | Đăng xuất | — | Dialog xác nhận → toast `Đã đăng xuất` → về `/login`; `localStorage` không còn token; bấm Back của trình duyệt **không** vào lại được trang cần quyền | |
| `TC-AUTH-08` | Đổi mật khẩu với mật khẩu hiện tại sai | — | HTTP 400 `Mật khẩu hiện tại không đúng` | |
| `TC-AUTH-09` | Đổi mật khẩu thành công | mới: `newpass123` | Toast thành công → tự đăng xuất → đăng nhập lại bằng mật khẩu mới thành công. **Đổi lại về mật khẩu cũ sau khi test** | |
| `TC-AUTH-10` | Cập nhật hồ sơ cá nhân (tên, email, ảnh đại diện) | — | Lưu thành công; tên trên Topbar cập nhật ngay không cần F5 | |
| `TC-ROLE-01` | Đăng nhập `user`, gõ thẳng URL `/users` vào thanh địa chỉ | — | Không vào được — chuyển sang trang `403 Forbidden` | |
| `TC-ROLE-02` | Dùng Postman: `user` gọi `POST /api/v1/events` | token của `user` | HTTP 403 `Bạn không có quyền truy cập tài nguyên này`, body đúng format `ErrorResponse` (JSON, không phải trang HTML) | |
| `TC-ROLE-03` | Dùng Postman: gọi `GET /api/v1/dashboard/summary` **không kèm token** | — | HTTP 401 `Bạn cần đăng nhập để thực hiện thao tác này` dạng JSON | |
| `TC-ROLE-04` | Dùng Postman: `user` gọi `GET /api/v1/events` (công khai) | không token | HTTP 200 — endpoint đọc sự kiện là `permitAll`, khách vẫn xem được | |
| `TC-ROLE-05` | `user` A đăng ký sự kiện, `user` B (tạo thêm bằng admin) gọi `DELETE /registrations/{id}` với id vé của A | token của B | HTTP 403 — chặn ở lớp kiểm tra chủ sở hữu, **không** cho huỷ vé người khác | |

---

## 3. Loại sự kiện & sự kiện — M2

| Mã ca | Các bước | Dữ liệu | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|
| `TC-CAT-01` | Tạo loại trùng tên nhưng khác hoa/thường | `hội thảo` khi đã có `Hội thảo` | HTTP 409 `Tên loại sự kiện đã tồn tại` | |
| `TC-CAT-02` | Xoá loại đang có sự kiện gắn vào | loại `Hội thảo` | HTTP 409 `Không thể xoá: đang có N sự kiện thuộc loại này`; toast đỏ hiện đúng số N | |
| `TC-CAT-03` | Xoá loại chưa gắn sự kiện nào | loại mới tạo | Xoá thành công, biến khỏi bảng | |
| `TC-EVT-01` | Tạo sự kiện thiếu tên | bỏ trống tên | HTTP 400; lỗi gắn **đúng dưới ô Tên**, không phải alert chung | |
| `TC-EVT-02` | Tạo sự kiện với sức chứa `0` | capacity = 0 | HTTP 400 — chặn ở cả client và server | |
| `TC-EVT-03` | Tạo sự kiện có thời gian kết thúc **trước** bắt đầu | start: 10:00, end: 09:00 | HTTP 400 `Thời gian kết thúc phải sau thời gian bắt đầu` | |
| `TC-EVT-04` | Sửa sự kiện: hạ sức chứa xuống dưới số người đã đăng ký | sự kiện có 1 đăng ký, hạ capacity về `0`… `1`→`0` | HTTP 409 `Sức chứa không thể nhỏ hơn số người đã đăng ký (N)` | |
| `TC-EVT-05` | `organizer` sửa sự kiện **do người khác tạo** | — | HTTP 403 | |
| `TC-EVT-06` | Đổi trạng thái `CANCELLED` → `OPEN` | — | HTTP 400 `Không thể chuyển trạng thái này` (huỷ là một chiều) | |
| `TC-EVT-07` | Lọc sự kiện theo loại | chọn `Hội thảo` | Chỉ ra sự kiện đúng loại; tham số `categoryId` lên URL; F5 **không mất bộ lọc** | |
| `TC-EVT-08` | Lọc theo khoảng thời gian với `từ` sau `đến` | từ: 30/09, đến: 01/09 | HTTP 400 `Tham số from phải nhỏ hơn hoặc bằng to` | |
| `TC-EVT-09` | Tìm kiếm bằng chữ IN HOA | `HỘI THẢO` | Vẫn ra kết quả (không phân biệt hoa/thường); ô tìm có debounce, không gọi API mỗi lần gõ | |
| `TC-EVT-10` | Tìm từ khoá không khớp gì | `zzzzzz` | Trạng thái rỗng `Không tìm thấy sự kiện phù hợp với 'zzzzzz'` + nút Xoá bộ lọc; **không** báo lỗi | |
| `TC-EVT-11` | Mở `GET /events/999999` | id không tồn tại | HTTP 404 `Không tìm thấy sự kiện`; frontend hiện trang 404 thân thiện, không màn hình trắng | |
| `TC-EVT-12` | Đổi trang ở danh sách sự kiện rồi F5 | trang 2 | Vẫn ở trang 2 (số trang đồng bộ lên URL) | |

---

## 4. Đăng ký tham dự — M3

| Mã ca | Các bước | Dữ liệu | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|
| `TC-REG-01` | `user` đăng ký sự kiện còn chỗ | — | HTTP 201, trả về `registrationId` + `code`; số chỗ còn giảm 1 | |
| `TC-REG-02` | `user` đăng ký lại lần 2 cùng sự kiện | — | HTTP 409 `errorCode=DUPLICATE_REGISTRATION`, message `Bạn đã đăng ký sự kiện này` | |
| `TC-REG-03` | Sự kiện `capacity=2`, đã có 2 đăng ký ACTIVE → người thứ 3 đăng ký | tạo thêm tài khoản để test | HTTP 409 `errorCode=OVERBOOKING`, message `Sự kiện đã hết chỗ`; **không** sinh bản ghi mới trong DB | |
| `TC-REG-04` | Đăng ký sự kiện đã `CLOSED` | — | HTTP 409 `errorCode=EVENT_CLOSED` `Sự kiện đã đóng đăng ký` | |
| `TC-REG-05` | Đăng ký sự kiện đã qua `endAt` | sửa sự kiện về mốc quá khứ trực tiếp trong DB | HTTP 409 `errorCode=EVENT_ENDED` `Sự kiện đã diễn ra` | |
| `TC-REG-06` | Huỷ đăng ký hợp lệ (sự kiện chưa bắt đầu, chưa điểm danh) | — | HTTP 200; bản ghi **vẫn còn** trong DB với `status=CANCELLED` (không bị xoá); `availableSeats` tăng lại 1 ngay | |
| `TC-REG-07` | **Đăng ký lại sau khi đã huỷ** cùng sự kiện đó | — | HTTP 201 thành công, sinh mã vé **mới**; **không** lỗi 500 do vi phạm unique `(event_id, user_id)` | |
| `TC-REG-08` | Huỷ đăng ký khi sự kiện đã bắt đầu | — | HTTP 409 `Sự kiện đã bắt đầu, không thể huỷ đăng ký` | |
| `TC-REG-09` | Huỷ đúng lượt đăng ký đã huỷ trước đó | gọi lại `DELETE` lần 2 | HTTP 409 `Lượt đăng ký này đã được huỷ trước đó` | |
| `TC-REG-10` | `user` thường gọi `GET /events/{id}/registrations` | token `user` | HTTP 403 | |
| `TC-REG-11` | Xem danh sách đăng ký của sự kiện có > 10 người | tạo đủ dữ liệu | Phân trang đúng; **STT tính theo trang** (trang 2 bắt đầu từ 11, không quay về 1) | |
| `TC-REG-12` | Quản lý người tham gia: tạo trùng email | — | HTTP 409 `Email đã tồn tại` | |
| `TC-REG-13` | Quản lý người tham gia: số điện thoại sai định dạng | `123` | HTTP 400, lỗi gắn đúng ô SĐT (yêu cầu 10 số, bắt đầu bằng 0) | |
| `TC-REG-14` | Xoá người tham gia còn đăng ký hiệu lực | — | HTTP 409 nêu rõ số lượt đăng ký còn lại | |

---

## 5. Điểm danh — M4

| Mã ca | Các bước | Dữ liệu | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|
| `TC-CHK-01` | Điểm danh bằng nút bấm cho lượt đăng ký ACTIVE | — | HTTP 200 `SUCCESS`; DB có đúng 1 bản ghi `check_in_history`; badge đổi ngay không cần F5 | |
| `TC-CHK-02` | Điểm danh lần 2 cùng lượt đăng ký | — | HTTP 409 `ALREADY_CHECKED_IN`, message nêu **đúng giờ** đã điểm danh trước đó | |
| `TC-CHK-03` | Điểm danh bằng mã vé **không tồn tại** | code `ZZZZZZZZ` | HTTP 404 `INVALID_TICKET` `Vé không hợp lệ`; toast đỏ | |
| `TC-CHK-04` | Điểm danh bằng mã vé của **sự kiện khác** | mã vé hợp lệ nhưng sai sự kiện | HTTP 400 `WRONG_EVENT` `Lượt đăng ký không thuộc sự kiện này` | |
| `TC-CHK-05` | Điểm danh lượt đăng ký **đã huỷ** | — | HTTP 409 `Lượt đăng ký đã bị huỷ` | |
| `TC-CHK-06` | Quét QR bằng camera trên điện thoại | mở trang check-in trên điện thoại | Xin quyền camera → quét được → tự điền mã và gọi API; có âm thanh báo | |
| `TC-CHK-07` | Từ chối quyền camera | bấm Block | **Tự chuyển sang ô nhập mã tay**, không treo màn hình | |
| `TC-CHK-08` | Nhập mã tay rồi nhấn Enter | — | Gửi luôn không cần bấm nút; sau mỗi lần gửi ô tự xoá để sẵn cho người tiếp theo | |
| `TC-CHK-09` | Điểm danh khi mất mạng (tắt Wi-Fi giữa lúc bấm) | — | Toast lỗi kết nối; **trạng thái dòng đó được hoàn tác**, không hiện "đã đến" giả | |
| `TC-CHK-10` | Lọc danh sách điểm danh theo `Tất cả` / `Đã đến` / `Chưa đến` | — | Đổi lựa chọn → về trang 0; `status` + `page` đồng bộ lên URL; **tổng số dòng `Đã đến` + `Chưa đến` = tổng `Tất cả`** | |
| `TC-CHK-11` | Sự kiện chưa có ai đăng ký → xem trang tổng hợp | — | Tất cả số liệu = 0, tỷ lệ `0.0%`; **không lỗi chia cho 0** | |

---

## 6. Thống kê & báo cáo — M5

| Mã ca | Các bước | Dữ liệu | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|
| `TC-STA-01` | Đối chiếu Dashboard với SQL đếm trực tiếp | chạy `SELECT COUNT(*) FROM events / registrations WHERE status='ACTIVE' / check_in_history` | Từng số trên Dashboard **khớp tuyệt đối** với kết quả SQL | |
| `TC-STA-02` | Xem Dashboard khi DB vừa khởi tạo (chỉ có seed) | — | Không lỗi; các chỉ số bằng 0 hoặc bằng số seed; tỷ lệ `0.0%` | |
| `TC-STA-03` | Kiểm tra thứ tự bảng Top sự kiện | tạo 3 sự kiện với 3/2/1 đăng ký | Sắp xếp **giảm dần** theo số đăng ký | |
| `TC-STA-04` | Bấm vào một dòng trong bảng Top sự kiện | — | Chuyển sang trang chi tiết đúng sự kiện đó | |
| `TC-STA-05` | Kiểm tra công thức tỷ lệ tham dự | 1 có mặt / 3 đăng ký | Hiện `33.3%` (làm tròn 1 chữ số thập phân) | |
| `TC-STA-06` | Thanh tiến độ đổi màu theo ngưỡng | tạo dữ liệu <50%, 50–80%, >80% | Đỏ / vàng / xanh tương ứng | |
| `TC-RPT-01` | Xuất CSV khoảng thời gian **không có sự kiện nào** | từ/đến ở năm 2030 | File tải về vẫn hợp lệ, chỉ có dòng tiêu đề; không lỗi 500 | |
| `TC-RPT-02` | Xuất CSV rồi mở bằng Excel | — | Tiếng Việt **không bị lỗi font** (file có BOM UTF-8) | |
| `TC-RPT-03` | Đếm số dòng CSV | — | Số dòng dữ liệu = số sự kiện trong khoảng thời gian đã chọn | |
| `TC-RPT-04` | `user` thường gọi `GET /reports/events/export` | token `user` | HTTP 403 | |

---

## 7. Responsive & đa trình duyệt

Theo `B6.2-T2`: test trên **Chrome desktop** và **chế độ mobile 360px**.

| Mã ca | Trang | Kết quả mong đợi | 360px | 1280px |
|---|---|---|---|---|
| `TC-RES-01` | Đăng nhập | Form full width ở mobile, card căn giữa ở desktop; ô nhập cao ≥44px | | |
| `TC-RES-02` | Danh sách sự kiện (cả chế độ lịch và danh sách) | Không tràn ngang; lưới card 1 → 2 → 3 cột theo bề rộng | | |
| `TC-RES-03` | Form tạo/sửa sự kiện | Mobile 1 cột, nút hành động dính đáy màn hình | | |
| `TC-RES-04` | Bảng người dùng / người tham gia | <768px chuyển sang dạng card; modal chiếm toàn màn hình | | |
| `TC-RES-05` | Màn hình điểm danh | **Ưu tiên mobile**: mỗi người 1 card, nút điểm danh cao ≥48px, ô tìm dính đầu màn hình | | |
| `TC-RES-06` | Dashboard | Thẻ số liệu 1 → 2 → 4 cột; biểu đồ và bảng không tràn ngang | | |
| `TC-RES-07` | Trang có mặt/vắng | ≥1024px hai bảng cạnh nhau, <1024px xếp dọc | | |
| `TC-RES-08` | Hộp thoại xác nhận & ngăn kéo bộ lọc trên mobile | Hiện đúng giữa **khung nhìn**, không rơi xuống giữa chiều cao toàn trang | | |

---

## 8. Kiểm thử tự động (hồi quy máy)

Chạy trước khi merge, cả hai phải xanh:

```bash
cd backend  && ./mvnw test     # 22 file test · 172 test case
cd frontend && npm test        # 14 file test · 76 test
```

| Lần chạy | Ngày | Backend | Frontend | Ghi chú |
|---|---|---|---|---|
| Trước khi mở PR B6.2 | 17/08/2026 | ✅ 172/172 (22 file) | ✅ 76/76 (14 file) | Không có test nào fail hay bị skip |

Hai bộ test này **không thay thế** kiểm thử tay ở mục 1–7: chúng phủ logic tầng service/controller và
các trang React ở mức component, nhưng không phủ luồng thật xuyên backend ↔ frontend ↔ MySQL,
không phủ camera QR, và không phủ responsive.

---

## 9. Phiếu lỗi & hồi quy cuối

### 9.1. Mẫu phiếu lỗi (`B6.2-T2`)

Mỗi lỗi tìm được mở **một** phiếu theo mẫu này:

```markdown
### BUG-<số> — <tiêu đề ngắn>

- **Ca kiểm thử phát hiện**: TC-xxx-yy
- **Mức độ**: Chặn luồng chính / Nghiêm trọng / Nhẹ / Giao diện
- **Môi trường**: Chrome 1280px | Chrome mobile 360px | Postman
- **Các bước tái hiện**:
  1.
  2.
- **Kết quả thực tế**:
- **Kết quả mong đợi**:
- **Ảnh chụp / log**:
- **Người phát hiện** / **Người sửa** / **Nhánh sửa**: `bugfix/...`
- **Trạng thái**: Mở / Đang sửa / Đã sửa (commit ...) / Đóng
```

### 9.2. Bảng theo dõi lỗi

| Mã | Tiêu đề | Mức độ | Ca phát hiện | Người sửa | Nhánh | Trạng thái |
|---|---|---|---|---|---|---|
| | | | | | | |

### 9.3. Nguyên tắc kiểm thử chéo (`B6.2-T2`)

> Mỗi người **test module của người khác**, không tự test module mình làm — người viết code luôn
> vô thức đi đúng con đường mình đã lập trình, nên không phát hiện được lỗi ở nhánh rẽ.

| Người | Module đã làm | Module phải test |
|---|---|---|
| TV1 | M1 Auth | M2 Sự kiện |
| TV2 | M2 Sự kiện | M3 Đăng ký |
| TV3 | M3 Đăng ký | M4 Điểm danh |
| TV4 | M4 Điểm danh | M5 Thống kê |
| TV5 | M5 Thống kê | M1 Auth |

### 9.4. Checklist hồi quy lần cuối (`B6.2-T4`)

Chạy **sau khi đã sửa hết lỗi chặn luồng**, trên **DB khởi tạo lại từ đầu**:

- [ ] `DROP DATABASE` + `CREATE DATABASE` rồi khởi động lại backend, seed chạy đúng
- [ ] Chạy lại toàn bộ mục 1 (`TC-INT-01` → `TC-INT-14`) — tất cả PASS
- [ ] Chạy lại các ca đã từng FAIL ở mục 2–7 — tất cả PASS
- [ ] `./mvnw test` xanh · `npm test` xanh
- [ ] `npm run build` không lỗi (kiểm tra bản production, không chỉ dev server)
- [ ] Không còn phiếu lỗi nào ở trạng thái Mở với mức độ **Chặn luồng chính**
