# QLSKDD — Hướng dẫn triển khai bằng Docker (B6.4)

> Tài liệu này là sản phẩm của **`B6.4-T5`**. Toàn bộ nội dung dưới đây đã được chạy thật và
> kiểm chứng trên Windows 11 + Docker 29.7.2 + Docker Compose v5.4.0.

---

## 1. Yêu cầu

| Thứ | Ghi chú |
|---|---|
| **Docker Desktop** | Windows cần bật WSL2 trước: `wsl --install` (PowerShell Admin) rồi khởi động lại máy |
| RAM trống ~4 GB | 3 container: MySQL + backend (JVM) + nginx |
| Cổng **3000** và **8080** còn trống | Cổng 3306 **không** cần trống — xem mục [5](#5-những-quyết-định-thiết-kế-và-lý-do) |

Không cần cài JDK, Maven hay Node trên máy — mọi thứ build bên trong container.

## 2. Chạy

```powershell
Copy-Item .env.example .env      # macOS/Linux: cp .env.example .env
```

Mở `.env` và sửa **hai** giá trị bắt buộc:

```env
QLSKDD_DB_PASSWORD=<mật khẩu bất kỳ cho MySQL trong container>
QLSKDD_JWT_SECRET=<sinh bằng: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

Rồi một lệnh duy nhất:

```bash
docker compose up -d --build
```

Lần đầu mất khoảng **3–5 phút** (tải image nền + tải dependency Maven + `npm ci`). Lần sau vài chục giây nhờ cache.

Nếu thiếu biến bắt buộc, compose **dừng ngay** với thông báo `Thieu QLSKDD_DB_PASSWORD - hay copy .env.example thanh .env` thay vì khởi động rồi chết giữa đường.

### Kiểm tra đã lên chưa

```bash
docker compose ps
```

Phải thấy `qlskdd-mysql` và `qlskdd-backend` ở trạng thái **healthy**:

```
qlskdd-backend    Up 18 seconds (healthy)
qlskdd-frontend   Up 17 seconds (healthy)
qlskdd-mysql      Up 28 seconds (healthy)
```

### Địa chỉ truy cập

| Thành phần | URL |
|---|---|
| **Ứng dụng** | http://localhost:3000 |
| API (qua nginx, cùng origin) | http://localhost:3000/api/v1 |
| API (trực tiếp, cho Postman) | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:3000/swagger-ui/index.html |
| MySQL | **không publish ra máy** — vào bằng `docker compose exec` (mục 4) |

### Tài khoản đăng nhập

Mặc định `QLSKDD_SPRING_PROFILES=prod,demo` nên `DemoSeeder` nạp sẵn dữ liệu:

| Username | Mật khẩu | Vai trò |
|---|---|---|
| `demo_admin` | `admin123` | ADMIN |
| `demo_organizer` | `organizer123` | ORGANIZER |
| `participant_1` … `participant_10` | `user123` | USER |

> [!WARNING]
> Đây là tài khoản demo với mật khẩu công khai. Khi triển khai thật, đặt
> `QLSKDD_SPRING_PROFILES=prod` — nhưng lưu ý lúc đó **database rỗng hoàn toàn, không đăng
> nhập được bằng bất kỳ tài khoản nào**, bạn phải tự tạo admin đầu tiên (mục 4).

## 3. Biến môi trường

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|:--:|---|---|
| `QLSKDD_DB_PASSWORD` | ✅ | — | Mật khẩu root của MySQL trong container |
| `QLSKDD_JWT_SECRET` | ✅ | — | Khoá ký JWT, sinh mới bằng lệnh ở mục 2 |
| `QLSKDD_DB_NAME` | | `qlsk_dd` | Tên database |
| `QLSKDD_JWT_EXPIRATION` | | `86400000` | Hạn access token (ms, mặc định 24h) |
| `QLSKDD_SPRING_PROFILES` | | `prod,demo` | `prod` = database rỗng; `prod,demo` = có dữ liệu demo |
| `QLSKDD_CORS_ALLOWED_ORIGINS` | | rỗng | Chỉ cần khi có client ở tên miền khác |

> [!IMPORTANT]
> **Tiền tố `QLSKDD_` không phải để cho đẹp.** Docker Compose ưu tiên biến môi trường của máy
> cao hơn file `.env`. Nhiều thành viên đã set sẵn `DB_PASSWORD` trên máy để chạy backend ở chế
> độ dev — nếu compose đọc đúng tên đó thì giá trị trong `.env` **bị bỏ qua hoàn toàn, không có
> một cảnh báo nào**. Lỗi này đã xảy ra thật khi dựng stack lần đầu: container MySQL nhận mật
> khẩu MySQL của máy thay vì mật khẩu trong `.env`, và chỉ lộ ra khi thử `mysql` bên trong container.

## 4. Vận hành

```bash
# Xem log (theo dõi liên tục)
docker compose logs -f backend

# Khởi động lại một service
docker compose restart backend

# Dừng, GIỮ dữ liệu
docker compose down

# Dừng và XOÁ SẠCH dữ liệu (dựng lại từ đầu, seeder chạy lại)
docker compose down -v

# Vào MySQL xem dữ liệu
docker compose exec mysql sh -lc 'mysql -h127.0.0.1 -uroot -p"$MYSQL_ROOT_PASSWORD" qlsk_dd'

# Build lại sau khi sửa code
docker compose up -d --build
```

**Tạo tài khoản admin đầu tiên khi chạy profile `prod` thuần** (database rỗng):

```sql
INSERT INTO roles (name) VALUES ('ROLE_ADMIN'), ('ROLE_ORGANIZER'), ('ROLE_USER');
-- Mật khẩu phải là chuỗi BCrypt, KHÔNG phải chuỗi thường.
-- Sinh bằng: docker compose exec backend sh -lc '...' hoặc dùng công cụ BCrypt bất kỳ.
INSERT INTO users (username, password, full_name, email, enabled, role_id, created_at)
VALUES ('admin', '<chuỗi-bcrypt>', 'Quản trị viên', 'admin@qlskdd.com', 1,
        (SELECT id FROM roles WHERE name = 'ROLE_ADMIN'), NOW());
```

## 5. Những quyết định thiết kế và lý do

Ghi lại để người sau không "sửa lại cho gọn" rồi làm hỏng:

| Quyết định | Lý do |
|---|---|
| **nginx proxy `/api/` sang backend**, frontend build với `VITE_API_BASE_URL=/api/v1` | Vite nhúng biến `VITE_*` vào bundle **lúc build**, không đọc được lúc container chạy. Dùng đường dẫn tương đối thì cùng một image chạy được ở mọi môi trường, và vì cùng origin nên **không phát sinh CORS** |
| **Không publish cổng 3306** của MySQL | Hầu hết thành viên đã có MySQL chạy ở cổng đó; publish sẽ làm `docker compose up` chết vì tranh cổng, mà thông báo `port is already allocated` không hề gợi ý thủ phạm |
| **Dùng image `maven:` + gọi `mvn`**, không dùng `./mvnw` | Repo phát triển trên Windows, `mvnw` dễ bị lưu với kết thúc dòng CRLF; trong container Linux sẽ báo `no such file or directory` — lỗi cực khó đoán vì file trông vẫn bình thường |
| **`depends_on: condition: service_healthy`** cho MySQL | MySQL nhận cổng trước khi sẵn sàng nhận truy vấn; chỉ `service_started` thì backend khởi động sớm, không kết nối được và chết |
| **JDK/JRE 17**, không lấy bản mới nhất | Khớp `<java.version>17</java.version>` trong pom; Spring Boot 3.2 chưa kiểm chứng trên các bản Java mới hơn |
| **`ddl-auto: update` ở profile prod** | `validate` đúng hơn cho production thật nhưng đòi schema có sẵn, nên sẽ làm backend chết ở lần chạy đầu trên MySQL rỗng — mất mục tiêu "một lệnh là cả hệ thống lên". Cách làm đúng là thêm Flyway/Liquibase rồi đổi sang `validate`; **dự án chưa làm phần đó** |
| **`try_files $uri $uri/ /index.html`** trong nginx | Thiếu dòng này thì đang ở `/events/5` bấm F5 sẽ ra 404 — lỗi kinh điển của SPA |
| **`index.html` không cache, `/assets/` cache 1 năm** | File trong `/assets/` có hash trong tên nên đổi nội dung là đổi tên; còn `index.html` trỏ tới chúng, cache nó thì sau khi deploy bản mới người dùng vẫn nạp bundle cũ đã bị xoá → trang trắng |

## 6. Xử lý sự cố

| Hiện tượng | Nguyên nhân & cách xử lý |
|---|---|
| `port is already allocated` | Backend hoặc frontend trên máy đang chạy ở 8080/3000. Tắt chúng, hoặc đổi cổng publish trong `docker-compose.yml` |
| Backend `Access denied for user 'root'` | Đã đổi `QLSKDD_DB_PASSWORD` sau khi volume được tạo. Mật khẩu chỉ áp dụng ở lần tạo volume đầu tiên → `docker compose down -v && docker compose up -d` |
| `qlskdd-backend` mãi ở `health: starting` rồi `unhealthy` | Xem `docker compose logs backend`. Thường là MySQL chưa lên (chờ thêm) hoặc thiếu `QLSKDD_JWT_SECRET` |
| Mở app thấy giao diện nhưng **không đăng nhập được bằng tài khoản nào** | Đang chạy `QLSKDD_SPRING_PROFILES=prod` thuần → database rỗng. Đổi về `prod,demo` rồi `docker compose down -v && docker compose up -d` |
| Bấm chức năng nào cũng lỗi mạng, Console báo CORS | Frontend được build với địa chỉ tuyệt đối thay vì `/api/v1`. Kiểm tra `args.VITE_API_BASE_URL` trong `docker-compose.yml` rồi build lại **không dùng cache**: `docker compose build --no-cache frontend` |
| Sửa code rồi mà container vẫn chạy bản cũ | Image không tự build lại: phải `docker compose up -d --build` |

## 7. Kết quả rà soát secret trong lịch sử Git (B6.4-T4)

Đã quét toàn bộ lịch sử commit (`git log --all -S<chuỗi>`), kết quả:

| Hạng mục | Kết quả | Đã xử lý |
|---|---|---|
| Mật khẩu MySQL trong lịch sử | **0 commit** — chưa bao giờ bị commit (luôn đọc từ `${DB_PASSWORD}`) | Không cần |
| Khoá JWT cũ `404E6352…` | **2 commit** có chứa | **Đã sinh khoá mới.** Xem giải thích dưới |
| `frontend/.env` | **Đang bị Git theo dõi** dù `.gitignore` có ghi `.env` | Đã `git rm --cached frontend/.env` |
| `spring.security.user.password: 123456` trong `application.yml` | Mật khẩu ghi cứng, là **cấu hình chết** (dự án có `CustomUserDetailsService` nên Spring bỏ qua khối này) | Đã xoá khỏi `application.yml` |
| API key / token dịch vụ ngoài | Không có — dự án không tích hợp dịch vụ ngoài nào | Không cần |

**Vì sao không xoá khoá JWT cũ khỏi lịch sử Git:** xoá được nhưng phải viết lại lịch sử
(`git filter-repo` / BFG), làm đổi hash của mọi commit sau đó — tất cả thành viên phải clone lại
và mọi Pull Request đang mở sẽ vỡ. Cái giá đó không đáng, vì **khoá cũ đã bị vô hiệu hoá**: nó
không còn nằm ở đâu trong hệ thống, profile prod bắt buộc truyền `APP_JWT_SECRET` từ ngoài,
và profile dev đã dùng khoá mới. Token ký bằng khoá cũ không xác thực được ở bất kỳ môi trường nào.

**Vì sao `frontend/.env` bị theo dõi dù có trong `.gitignore`:** `.gitignore` chỉ ngăn Git bắt
đầu theo dõi file MỚI. File nào đã được `git add` một lần thì Git tiếp tục theo dõi mãi, bất kể
`.gitignore` viết gì. Nội dung file này vô hại (chỉ có `VITE_API_BASE_URL`), nhưng đây là cái
bẫy thật: sau này ai thêm một secret vào đó thì nó sẽ **âm thầm bị commit** mà không có cảnh báo.
Sau thay đổi này, người mới clone về phải `cp .env.example .env` trong thư mục `frontend/`
(đã ghi trong README).

## 8. CI/CD (B6.5)

### 8.1. Pipeline chạy khi nào

Định nghĩa ở [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml).

| Sự kiện | `backend` | `frontend` | `deploy` |
|---|:--:|:--:|:--:|
| Pull request vào `develop` / `main` | ✅ | ✅ | ❌ |
| Push vào `develop` | ✅ | ✅ | ❌ |
| **Push vào `main`** | ✅ | ✅ | ✅ |

Job `deploy` khai báo `needs: [backend, frontend]` nên **chỉ chạy khi cả hai job test đã xanh**. Test đỏ thì không có gì được deploy.

Push liên tiếp lên cùng một nhánh sẽ **huỷ lượt chạy cũ** (`concurrency` + `cancel-in-progress`) — không phải chờ kết quả của commit đã bị thay thế.

CI **không cần secret và không cần MySQL**: dự án không có test nào dùng `@SpringBootTest`, chỉ có `@WebMvcTest`, `@DataJpaTest` (H2 nhúng) và test Mockito thuần. Đã kiểm chứng bằng cách chạy lại toàn bộ với biến `DB_PASSWORD` bị xoá — vẫn 172/172 pass.

### 8.2. Vì sao dùng Deploy Hook thay vì auto-deploy của Render

Render có sẵn tính năng tự deploy mỗi khi repo có commit mới, nhưng nó deploy **ngay lập tức, không quan tâm test xanh hay đỏ** — tức là bỏ qua đúng cái mà `B6.5-T2` yêu cầu. Vì vậy `render.yaml` đặt `autoDeployTrigger: off`, và workflow gọi Deploy Hook sau khi test xanh.

> Job `deploy` xanh nghĩa là **đã gửi yêu cầu deploy thành công**, không phải "đã deploy xong". Render build ở phía họ mất thêm vài phút — xem tiến trình thật ở dashboard Render.

### 8.3. Xem kết quả

- **GitHub → tab Actions** → chọn lượt chạy → xem log từng job
- Trên mỗi Pull Request, kết quả hiện ngay ở khối *Checks* dưới phần bình luận
- Deploy: **Render Dashboard → service → tab Events / Logs**

### 8.4. Rollback nhanh khi bản mới lỗi

**Cách 1 — Rollback trên Render (nhanh nhất, ~1 phút).** Dashboard → service → tab **Deploys** → tìm bản deploy tốt gần nhất → **Rollback**. Không cần đụng tới Git, dùng lại đúng image đã build trước đó.

**Cách 2 — Revert bằng Git (khi lỗi nằm ở mã nguồn).**

```bash
git revert <hash-commit-loi>
git push origin main          # pipeline chạy lại và deploy bản đã revert
```

Ưu tiên **Cách 1** để dừng chảy máu trước, rồi mới bình tĩnh làm Cách 2. Đừng sửa vội rồi push thẳng lên `main` khi đang hỏng — dễ hỏng thêm.

> [!WARNING]
> Rollback **không** hoàn tác thay đổi cơ sở dữ liệu. Dự án đang dùng `ddl-auto: update` nên nếu bản lỗi đã thêm cột/bảng thì rollback ứng dụng không xoá chúng đi. Đây là một lý do nữa để chuyển sang Flyway (xem mục 9).

### 8.5. Hạ tầng đang dùng

| Thành phần | Nơi chạy | Gói | Lưu ý |
|---|---|---|---|
| Frontend | Render Static Site · Singapore | Free | **Không bao giờ ngủ** |
| Backend | Render Web Service (Docker) · Singapore | Free | **Ngủ sau 15 phút** không dùng, lần gọi đầu mất ~1 phút |
| MySQL 8.4 | Aiven · DigitalOcean Bangalore | Free | 1GB · 1 CPU · tối đa 76 kết nối; **có thể bị tắt nếu để lâu không dùng** |

> [!IMPORTANT]
> **Trước buổi demo phải "đánh thức" cả backend lẫn database ít nhất 5 phút trước.** Mở trang, đăng nhập một lần, xem Dashboard. Cả hai dịch vụ đều ở gói miễn phí và đều tự tắt khi rảnh — chờ 1 phút màn hình trắng ngay lúc trình bày là tình huống hoàn toàn tránh được.

### 8.6. Bảng biến môi trường trên Render (service backend)

| Biến | Nguồn | Giá trị |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `render.yaml` | `prod,demo` |
| `SPRING_DATASOURCE_URL` | **nhập tay** | `jdbc:mysql://<host>.aivencloud.com:<port>/defaultdb?sslMode=REQUIRED&serverTimezone=Asia/Ho_Chi_Minh&characterEncoding=UTF-8` |
| `SPRING_DATASOURCE_USERNAME` | **nhập tay** | `avnadmin` |
| `DB_PASSWORD` | **nhập tay** | mật khẩu Aiven |
| `APP_JWT_SECRET` | Render tự sinh | — |
| `APP_DEMO_ADMIN_PASSWORD` … | **nhập tay** | mật khẩu demo riêng của nhóm |

`sslMode=REQUIRED` là **bắt buộc** — Aiven từ chối mọi kết nối không mã hoá. Chuỗi kết nối ở profile dev đang để `useSSL=false` nên copy nguyên si sang sẽ không kết nối được.

## 9. Việc chưa làm

Nói rõ để không ai tưởng phần này đã xong:

- **Chưa có migration tự động** (Flyway/Liquibase) — đang dựa vào `ddl-auto: update`
- **Deploy thật**: đã có (Render + Aiven, xem mục 8). Nhưng toàn bộ ở gói miễn phí — backend ngủ sau 15 phút, database 1GB và có thể bị tắt khi để lâu không dùng. Không phù hợp cho lưu lượng thật
- **Chưa có HTTPS** — nginx chỉ nghe cổng 80 trong mạng nội bộ Docker
- **Chưa giới hạn tài nguyên container** (`deploy.resources.limits`) — không cần ở quy mô đồ án
