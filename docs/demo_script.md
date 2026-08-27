# QLSKDD — Kịch bản demo cuối kỳ (B6.3)

> Tài liệu này là sản phẩm của **`B6.3-T1`** (kịch bản theo mốc thời gian), **`B6.3-T3`** (phân vai
> trình bày & slide) và **`B6.3-T4`** (diễn tập có bấm giờ + phương án dự phòng).
> Dữ liệu demo do `DemoSeeder` nạp — xem mục [2](#2-dữ-liệu--tài-khoản-demo).

**Thời lượng mục tiêu: 15 phút trình bày + 5 phút hỏi đáp.**

---

## 1. Chuẩn bị trước buổi demo

### 1.1. Trước 30 phút — dựng dữ liệu demo sạch

```sql
DROP DATABASE IF EXISTS qlsk_dd_demo;
```

```powershell
$env:DB_PASSWORD = "<mật khẩu MySQL>"
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo     # Windows: mvnw.cmd
```

Chờ console in đúng dòng này thì mới coi là dựng xong:

```
DemoSeeder: đã tạo dữ liệu demo sạch — 3 loại sự kiện · 4 sự kiện (OPEN / CLOSED / CANCELLED /
kín chỗ) · 12 tài khoản (admin, organizer, user, user_2..user_10) · 18 lượt đăng ký ·
6 lượt điểm danh.
```

> [!IMPORTANT]
> Profile `demo` dùng database **riêng** `qlsk_dd_demo` (không phải `qlsk_dd` của profile dev), và
> `DemoSeeder` **chỉ nạp khi database còn rỗng**. Nếu console in `database đã có dữ liệu nên bỏ qua
> tạo mới` thì phải `DROP DATABASE qlsk_dd_demo;` rồi khởi động lại — đừng demo tiếp với dữ liệu cũ.

```bash
cd frontend && npm run dev        # http://localhost:5173
```

### 1.2. Checklist trước 10 phút

- [ ] Backend chạy, mở `http://localhost:8080/swagger-ui/index.html` thấy trang Swagger
- [ ] Frontend mở được `http://localhost:5173`, không có lỗi đỏ ở Console (F12)
- [ ] Đăng nhập thử `admin` **rồi đăng xuất** — để chắc chắn tài khoản chạy được
- [ ] **Xoá `localStorage`** sau khi thử (F12 → Application → Clear site data) để demo bắt đầu từ trang đăng nhập
- [ ] Zoom trình duyệt **110–125%** cho người ngồi xa đọc được
- [ ] Đóng hết tab lạ, tắt thông báo Windows/Zalo/Messenger (**Focus assist: On**)
- [ ] Mở sẵn 1 tab Postman với collection `docs/postman/` để demo phần 403/401
- [ ] Điện thoại đã kết nối **cùng mạng LAN**, mở sẵn trang check-in (cho phần quét QR)
- [ ] Video dự phòng và file backup SQL đã ở sẵn trên Desktop (mục [5](#5-phương-án-dự-phòng-b63-t4))

### 1.3. Nếu demo trên bản deploy thay vì máy cá nhân

Hệ thống đã chạy thật trên internet:

| Thành phần | Địa chỉ |
|---|---|
| **Ứng dụng** | https://qlskdd-frontend.onrender.com |
| API (Postman) | https://qlskdd-backend.onrender.com/api/v1 |
| Swagger UI | https://qlskdd-frontend.onrender.com/swagger-ui/index.html |

> [!CAUTION]
> **Bắt buộc đánh thức trước 5 phút.** Backend chạy gói miễn phí của Render nên **tự tắt sau 15 phút không ai dùng**. Lần gọi đầu sau đó phải chờ **khoảng 1 phút rưỡi**: Render quảng cáo ~50 giây, nhưng **đo thực tế trên chính service này là 65,8 giây** riêng phần khởi động ứng dụng, cộng thêm thời gian dựng container. Database trên Aiven cũng có thể bị tắt khi để lâu.
>
> Cách đánh thức: mở trang, đăng nhập một lần, mở Dashboard. Thấy số liệu hiện ra là cả hai đã sẵn sàng.
>
> Không làm bước này thì đúng lúc trình bày sẽ đứng nhìn màn hình trắng gần một phút — tình huống hoàn toàn tránh được.

Ưu điểm khi demo bản deploy: chứng minh được sản phẩm chạy thật ngoài môi trường phát triển, và cho thấy phần CI/CD có kết quả cụ thể. Nhược điểm: phụ thuộc mạng phòng thi và độ trễ Singapore ↔ Bangalore.

**Khuyến nghị: chạy bản ở máy làm chính, mở sẵn bản deploy ở một tab riêng** để chiếu khi nói tới phần triển khai. Bản ở máy nhanh hơn và không phụ thuộc mạng.

---

## 2. Dữ liệu & tài khoản demo

### 2.1. Tài khoản

| Username | Vai trò | Dùng ở phần |
|---|---|---|
| `admin` | `ROLE_ADMIN` | Phần 2 (phân quyền), Phần 6 (thống kê) |
| `organizer` | `ROLE_ORGANIZER` | Phần 3, 4, 5 |
| `user`, `user_2` … `user_10` | `ROLE_USER` | Phần 4 (đăng ký), Phần 5 (vé QR) |

**Tên tài khoản giống nhau ở mọi môi trường, nhưng MẬT KHẨU thì không:**

| Môi trường | `admin` | `organizer` | `user`, `user_2`…`user_10` |
|---|---|---|---|
| Chạy ở máy (`docker compose` hoặc `mvnw spring-boot:run`) | `admin123` | `organizer123` | `user123` |
| **Bản deploy** https://qlskdd-frontend.onrender.com | `admin@123` | `organizer@123` | `user@123` |

Bản deploy dùng mật khẩu khác vì có URL công khai trên internet — để nguyên mật khẩu mặc định thì ai tìm ra địa chỉ cũng vào được với quyền quản trị.

Ba giá trị của bản deploy nằm ở Render → `qlskdd-backend` → **Environment** → `APP_DEMO_ADMIN_PASSWORD` / `APP_DEMO_ORGANIZER_PASSWORD` / `APP_DEMO_USER_PASSWORD`. Đổi ở đó **không đủ** để đổi mật khẩu: `DemoSeeder` chỉ tạo tài khoản khi database còn rỗng, nên phải xoá bảng rồi **Deploy latest commit** (xem `deployment.md` mục 6).

### 2.2. Sự kiện có sẵn

| Sự kiện | Loại | Trạng thái | Sức chứa | Đăng ký ACTIVE | Đã điểm danh |
|---|---|---|---|---|---|
| Hội thảo AI cho doanh nghiệp | Hội thảo | `OPEN` (còn 2 ngày) | 30 | 6 (+1 đã huỷ) | 4 |
| Workshop Thiết kế giao diện **(đã kín chỗ)** | Workshop | `OPEN` (còn 5 ngày) | 5 | **5 — hết chỗ** | 0 |
| Workshop Nâng cao kỹ năng thuyết trình | Workshop | `CLOSED` (đã diễn ra) | 20 | 4 | 2 |
| Team building cuối năm | Team building | `CANCELLED` | 25 | 2 | 0 |

### 2.3. Số liệu Dashboard phải khớp

Nếu 4 con số này không đúng thì dữ liệu demo đã bị chỉnh — dựng lại trước khi trình bày.

| Chỉ số | Giá trị mong đợi |
|---|---|
| Tổng sự kiện | **4** |
| Sắp diễn ra (OPEN & chưa bắt đầu) | **2** |
| Tổng lượt đăng ký (chỉ ACTIVE) | **17** |
| Tổng lượt điểm danh | **6** |
| Tỷ lệ điểm danh | **35.3%** |

Bảng Top sự kiện sắp giảm dần: Hội thảo AI (6) → Thiết kế giao diện (5) → Thuyết trình (4) → Team building (2).

---

## 3. Kịch bản theo mốc thời gian (`B6.3-T1`)

| Mốc | Phần | Người trình bày | Nội dung & thao tác |
|---|---|---|---|
| **0:00 – 1:30** | **1. Giới thiệu** | TV1 | Bài toán: quản lý sự kiện bằng Google Form + Excel không chống được vượt chỗ, điểm danh chậm, số liệu tổng hợp tay. Nêu 3 điều hệ thống giải quyết. Chiếu sơ đồ kiến trúc 2 tầng (React ⇄ REST API ⇄ MySQL). **Chưa mở app.** |
| **1:30 – 3:30** | **2. Đăng nhập & phân quyền** | TV1 | Đăng nhập `admin` → chỉ Sidebar có đủ mục quản trị. Đăng xuất, đăng nhập `user` → Sidebar **rút gọn**, không còn Người dùng / Loại sự kiện. Gõ thẳng URL `/users` → ra trang **403**. Chuyển sang Postman: gọi `POST /events` bằng token của `user` → **403 JSON**. Chốt: *"chặn ở backend, không chỉ ẩn nút."* |
| **3:30 – 6:00** | **3. Quản lý sự kiện** | TV2 | Đăng nhập `organizer`. Danh sách sự kiện: chỉ **chế độ lịch** (thanh thời lượng theo ngày, màu theo loại) rồi bấm sang **chế độ danh sách**. Lọc theo loại `Workshop` → chỉ ra vào URL. **Tạo sự kiện mới** ngay trên sân khấu (sức chứa 2, thời gian 2 ngày tới) → 201, chuyển sang trang chi tiết. Thử sửa cho `endAt` trước `startAt` → hiện lỗi validate. |
| **6:00 – 8:30** | **4. Đăng ký & chống vượt chỗ** | TV3 | Đăng nhập `user_6` → mở sự kiện vừa tạo → **Đăng ký** → toast kèm **mã vé 8 ký tự**, số chỗ còn giảm. Mở **Sự kiện của tôi** → xem **vé QR**. Sau đó mở **"Workshop Thiết kế giao diện (đã kín chỗ)"** bằng `user_7` → bấm Đăng ký → **`Sự kiện đã hết chỗ`**. Thử đăng ký lại sự kiện đã đăng ký → **`Bạn đã đăng ký sự kiện này`**. Chốt: *"chặn ở tầng nghiệp vụ, một người một suất."* |
| **8:30 – 11:00** | **5. Điểm danh QR** | TV4 | `organizer` → sự kiện vừa tạo → **Xem người đăng ký** (thanh tiến độ `1/2`) → sang **Điểm danh**. **Chuyển sang màn hình điện thoại**: quét mã QR của `user_6` → điểm danh thành công, có tiếng báo. Quét **lần thứ hai cùng mã** → `Người này đã điểm danh lúc HH:mm`. Nhập tay một mã sai → `Vé không hợp lệ`. Mở trang **Có mặt / Vắng mặt**, lọc `Chưa đến`. Chốt: *"một vé quét đúng một lần."* |
| **11:00 – 13:30** | **6. Dashboard & báo cáo** | TV5 | Mở **Dashboard**: 4 thẻ số liệu + tỷ lệ điểm danh + biểu đồ Top sự kiện. Bấm vào một dòng Top → nhảy sang chi tiết sự kiện. **Xuất báo cáo CSV** theo khoảng thời gian → **mở file bằng Excel ngay trên sân khấu** để cho thấy tiếng Việt không lỗi font. |
| **13:30 – 15:00** | **7. Chất lượng & kết** | TV1 điều phối | Nêu số liệu kiểm thử: **172 test case backend / 76 test frontend, tất cả xanh**. Nhắc kiến trúc phân tầng + `BaseRes`/`ErrorResponse` thống nhất. Việc còn lại (Docker hoá, CI/CD) nói là **hạng `Could`, chưa làm**, không nói quá. Cảm ơn & mời đặt câu hỏi. |

### 3.1. Nếu bị cắt còn 10 phút

Bỏ theo đúng thứ tự này, **không** bỏ tuỳ hứng:

1. Bỏ đoạn Postman ở phần 2 (giữ lại trang 403 trên giao diện) — tiết kiệm ~40 giây
2. Bỏ đoạn lọc + sửa lỗi validate ở phần 3, chỉ tạo sự kiện — ~60 giây
3. Bỏ đoạn nhập mã tay ở phần 5, chỉ quét QR + quét trùng — ~40 giây
4. Bỏ mở file Excel ở phần 6, chỉ cho thấy file đã tải về — ~40 giây

**Tuyệt đối không bỏ**: hết chỗ (phần 4) và quét QR trùng (phần 5) — đây là hai điểm mạnh nhất của bài.

---

## 4. Phân vai & dàn ý slide (`B6.3-T3`)

### 4.1. Phân vai

Nguyên tắc: **mỗi người trình bày đúng module mình làm**, một người điều phối chuyển cảnh và bấm giờ.

| Người | Vai | Phần | Module đã làm |
|---|---|---|---|
| TV1 | **Điều phối** + Xác thực/Phân quyền | 1, 2, 7 | M1 Auth |
| TV2 | Sự kiện | 3 | M2 Sự kiện |
| TV3 | Đăng ký | 4 | M3 Đăng ký |
| TV4 | Điểm danh (**giữ điện thoại quét QR**) | 5 | M4 Điểm danh |
| TV5 | Thống kê & báo cáo | 6 | M5 Thống kê |

Người điều phối chịu trách nhiệm: bấm giờ, nhắc khi một phần quá 30 giây so với mốc, và **chuyển sang video dự phòng** nếu hệ thống sự cố.

### 4.2. Dàn ý slide (8 slide, không nhiều hơn)

| # | Slide | Nội dung |
|---|---|---|
| 1 | Bìa | Tên đề tài · nhóm · thành viên |
| 2 | Bài toán | 3 vấn đề của cách làm thủ công (vượt chỗ · điểm danh chậm · số liệu tay) |
| 3 | Giải pháp | 5 nhóm chức năng, mỗi nhóm một dòng |
| 4 | Kiến trúc | Sơ đồ 2 tầng + phân tầng backend `Controller → Service → Repository` |
| 5 | Công nghệ | Bảng công nghệ 3 tầng (React/Spring Boot/MySQL) |
| 6 | Phân quyền | Bảng 3 vai trò + hình 403 |
| 7 | Chất lượng | 172 test BE · 76 test FE · phân trang & chống N+1 · xử lý lỗi tập trung |
| 8 | Kết | Việc đã làm · việc còn lại (Docker, CI/CD — hạng `Could`) · cảm ơn |

> Slide chỉ dùng ở phần 1 và phần 7. Từ phút 1:30 đến 13:30 **chiếu ứng dụng thật**, không quay lại slide — demo sản phẩm chạy được thuyết phục hơn ảnh chụp.

---

## 5. Phương án dự phòng (`B6.3-T4`)

| Rủi ro | Dấu hiệu | Phương án |
|---|---|---|
| **Mất mạng / mạng trường chậm** | Trang không tải | Toàn bộ demo chạy **localhost**, không phụ thuộc internet. Chỉ phần quét QR bằng điện thoại cần LAN → dự phòng: dùng **ô nhập mã tay** ngay trên laptop |
| **Camera điện thoại không xin được quyền** | Trang check-in báo lỗi quyền | Hệ thống **tự chuyển sang ô nhập mã tay** — trình bày luôn theo hướng đó, không loay hoay xin quyền |
| **Backend chết giữa demo** | API lỗi 500 / trang trắng | Người điều phối chuyển ngay sang **video dự phòng**; TV1 vừa chiếu vừa thuyết minh. Song song, TV2 khởi động lại backend ở terminal thứ hai |
| **Dữ liệu demo bị làm sai lệch khi diễn tập** | Số liệu Dashboard không khớp mục 2.3 | `DROP DATABASE qlsk_dd_demo;` + chạy lại profile demo (~1 phút), hoặc **restore từ file backup** ở dưới |
| **MySQL không khởi động** | Backend báo lỗi kết nối | Dùng bản **video dự phòng** — không cố sửa MySQL trên sân khấu |
| **Máy trình bày có sự cố** | — | Chuẩn bị **máy thứ hai** đã cài sẵn và đã chạy thử toàn bộ kịch bản |

### 5.1. Chuẩn bị bắt buộc trước 1 ngày

- [ ] **Quay video dự phòng** chạy trọn kịch bản mục 3 (có tiếng thuyết minh), lưu **offline** trên Desktop — không để trên Drive
- [ ] **Backup dữ liệu demo** để restore nhanh hơn là seed lại:
  ```bash
  mysqldump -u root -p qlsk_dd_demo > docs/demo_backup.sql
  # restore: mysql -u root -p qlsk_dd_demo < docs/demo_backup.sql
  ```
- [ ] Chuẩn bị máy thứ hai đã cài đủ JDK 17 · Node 18+ · MySQL 8 và **đã chạy thử hết kịch bản**
- [ ] Sạc đầy laptop + điện thoại, mang theo sạc và cáp

### 5.2. Diễn tập có bấm giờ

Diễn tập **ít nhất 2 lần**, lần cuối phải đủ 5 người và bấm giờ thật.

| Lần | Ngày | Thời lượng thực tế | Phần bị quá giờ | Điều chỉnh |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |

Sau mỗi lần diễn tập, dựng lại dữ liệu demo (mục 1.1) — diễn tập chắc chắn đã tạo sự kiện và điểm danh, làm lệch số liệu ở mục 2.3.

---

## 6. Câu hỏi có thể bị hỏi & cách trả lời

| Câu hỏi | Trả lời ngắn |
|---|---|
| *Sao không cho tự đăng ký tài khoản?* | Bản cơ bản cố ý bỏ luồng đăng ký công khai + OTP email; tài khoản do ADMIN tạo. Đây là quyết định thu hẹp phạm vi cho 3 tuần, không phải thiếu sót. |
| *Chống vượt chỗ khi hai người bấm cùng lúc thì sao?* | Kiểm tra tồn chỗ nằm trong service có `@Transactional`; bảng `registrations` còn có ràng buộc unique `(event_id, user_id)` ở tầng DB. Nói thật: **chưa** kiểm thử tải đồng thời — đó là việc tiếp theo. |
| *Vé QR có bị chụp lại rồi dùng lại được không?* | Không: mỗi vé quét đúng một lần, `check_in_histories` có unique trên `registration_id`, lần quét thứ hai trả `ALREADY_CHECKED_IN`. |
| *Token hết hạn thì sao?* | Access token 24 giờ, hết hạn thì đăng nhập lại. Bản này cố ý không làm refresh token. |
| *Đã triển khai thật chưa?* | Chưa — Docker và CI/CD ở hạng `Could`, chưa làm. Hiện chạy ở môi trường local. |
| *Đã kiểm thử tới mức nào?* | 172 test case backend (service, controller, phân quyền, JWT) và 76 test frontend, cộng bảng kiểm thử tích hợp tay ở `docs/test_cases.md`. |
