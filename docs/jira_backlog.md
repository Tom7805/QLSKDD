# Epic 3 — Đăng ký tham gia

## `B3.2` — Huỷ đăng ký

> **User story**: *Là người dùng, tôi muốn huỷ đăng ký để nhường chỗ khi không tham gia được.*
> **Tiêu chí chấp nhận**: Huỷ chỉ đổi trạng thái, không xoá dữ liệu; chỗ trống tăng lại ngay; chặn huỷ khi đã điểm danh hoặc sự kiện đã bắt đầu
> **Ưu tiên**: Should · **Điểm**: 3 · **Module**: M3 · **Sprint**: Tuần 3 · **Phụ trách**: TV3 — M3 Đăng ký

### 📦 Backend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B3.2-T1` | `BE-SVC` | **Logic huỷ đăng ký** | • Đổi `status = CANCELLED`, **không xoá bản ghi** (giữ lịch sử)<br>• Chỉ chính chủ hoặc ADMIN được huỷ, người khác → 403<br>• Chặn huỷ khi: `startAt` đã qua → 409 kèm lý do<br>• *(Chặn khi đã có bản ghi điểm danh — tạm hoãn, phụ thuộc B4.1 chưa triển khai)* | 2 | ✅ Đã code (`RegistrationServiceImpl.cancel`, `RegistrationSecurityService`) — thiếu nhánh check-in do B4.1 chưa xong |
| `B3.2-T2` | `BE-SVC` | **Bảo đảm chỗ trống tăng lại** | • Rà soát: mọi truy vấn đếm chỗ đều lọc `status = ACTIVE`<br>• Sự kiện đầy, huỷ 1 lượt → `availableSeats` tăng lại 1 ngay lập tức | 1 | ✅ Đã đúng sẵn (dùng lại `countByEventIdAndStatus`/`countGroupedByEventIdsAndStatus`, không cần sửa gì thêm) |
| `B3.2-T3` | `BE-API` | **API DELETE /registrations/{id}** | • Trả `BaseRes` 200 `"Đã huỷ đăng ký"` | 1 | ✅ Đã code (`RegistrationController.cancel`) |
| `B3.2-T4` | `BE-TEST` | **Test case huỷ đăng ký** | • TC1: huỷ hợp lệ → status CANCELLED, `availableSeats` tăng 1<br>• TC2: huỷ đăng ký của người khác → 403<br>• TC3: đã điểm danh rồi huỷ → 409<br>• TC4: sự kiện đã bắt đầu → 409 | 2 | ⚠️ TC1, TC2 (qua `RegistrationSecurityService`), TC4 đã có test; **TC3 chưa viết được** vì chưa có tính năng điểm danh (B4.1) để giả lập |

### 🟩 Frontend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B3.2-T5` | `FE-UI` | **Trang 'Sự kiện của tôi'** | • `GET /registrations/me` → danh sách sự kiện đã đăng ký<br>• Mỗi dòng: tên sự kiện, thời gian, trạng thái đăng ký, trạng thái điểm danh, nút Huỷ<br>• Nút Huỷ ẩn khi đã điểm danh hoặc sự kiện đã bắt đầu | 2 | ⬜ Chưa làm — cần thêm `GET /registrations/me` (chưa có API) |
| `B3.2-T6` | `FE-ALERT` | **Confirm & toast huỷ đăng ký** | • Dialog `"Huỷ đăng ký sự kiện '<tên>'? Chỗ của bạn sẽ được nhường lại."`<br>• Thành công → toast + tự tải lại danh sách | 1 | ⬜ Chưa làm |
| `B3.2-T7` | `FE-RES` | **Responsive 'Sự kiện của tôi'** | • Mobile: mỗi lượt đăng ký là 1 card xếp dọc, nút Huỷ full width | 1 | ⬜ Chưa làm |

### Ghi chú bàn giao

- Backend đã có thể test thật qua Postman (xem hướng dẫn test API bên dưới / trong tin nhắn bàn giao).
- **Việc còn thiếu trước khi đóng story**: API `GET /api/v1/registrations/me` (liệt kê đăng ký của chính user) chưa tồn tại — FE cần API này cho `B3.2-T5`, hiện chưa có task backend nào tạo nó. Cần bổ sung 1 task `BE-API` nhỏ nếu muốn làm `B3.2-T5` ngay.
- Nhánh điểm danh của `B3.2-T1`/`T4` (TC3) phụ thuộc `B4.1` — nên làm `B4.1` trước, sau đó quay lại bổ sung 1 điều kiện + 1 test cho `B3.2`.

---

## `B3.3` — Xem danh sách người đăng ký của một sự kiện

> **User story**: *Là ban tổ chức, tôi muốn xem danh sách người đăng ký của một sự kiện để chuẩn bị.*
> **Tiêu chí chấp nhận**: Danh sách phân trang, hiển thị tổng đăng ký / sức chứa; chỉ ORGANIZER và ADMIN xem được, người khác nhận 403
> **Ưu tiên**: Must · **Điểm**: 3 · **Module**: M3 · **Sprint**: Tuần 2 · **Phụ trách**: TV3 — M3 Đăng ký

### 📦 Backend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B3.3-T1` | `BE-REPO` | **Truy vấn danh sách đăng ký theo sự kiện** | • Phân trang theo eventId, sắp xếp `registeredAt desc`<br>• Nạp kèm thông tin user bằng `@EntityGraph`/join fetch để **không sinh N+1 query** | 2 | ✅ Đã có sẵn từ B3.1-T2 (`RegistrationRepository.findByEventId`), tái sử dụng nguyên bản không sửa gì |
| `B3.3-T2` | `BE-API` | **API GET /events/{eventId}/registrations** | • `@PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")` → người thường nhận 403<br>• `PageRes<RegistrationRes>`: id, họ tên, email, số điện thoại, thời gian đăng ký, trạng thái, đã điểm danh chưa<br>• Trả kèm `summary: { totalRegistered, capacity }` | 2 | ✅ Đã code (`EventController.getEventRegistrations`, `RegistrationServiceImpl.getRegistrationsByEvent`, DTO mới `RegistrationListItemRes`/`EventRegistrationsRes`) — `checkedIn` tạm luôn `false` vì B4.1 chưa xong |
| `B3.3-T3` | `BE-TEST` | **Test case danh sách đăng ký** | • TC1: ORGANIZER gọi → 200 đúng số bản ghi<br>• TC2: USER thường gọi → 403<br>• TC3: phân trang đúng `totalElements` | 1 | ✅ Đã viết đủ 3 TC (TC1/TC2 qua MockMvc trong `EventControllerTest`, TC3 qua unit test trong `RegistrationServiceTest`) |

### 🟩 Frontend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B3.3-T4` | `FE-UI` | **Trang danh sách người đăng ký** | • Bảng: STT tính đúng theo trang (`page*size + index + 1`), họ tên, email, SĐT, thời gian đăng ký, trạng thái<br>• Dùng lại component phân trang chung | 2 | ⬜ Chưa làm |
| `B3.3-T5` | `FE-UI` | **Thanh tiến độ đăng ký / sức chứa** | • Đầu trang hiện `"Đã đăng ký: 45 / 60"` kèm progress bar<br>• Đổi màu khi vượt 80% sức chứa | 1 | ⬜ Chưa làm |
| `B3.3-T6` | `FE-RES` | **Responsive bảng đăng ký** | • <768px: ẩn bớt cột phụ (SĐT), cho cuộn ngang hoặc chuyển card | 1 | ⬜ Chưa làm |

### Ghi chú bàn giao

- API đã chạy thật, 69/69 test pass (tính cả các story trước). Response mẫu và mã lỗi đầy đủ ở `docs/api_contract.md` mục 13.
- `checkedIn` trong mỗi dòng luôn trả `false` — chưa phản ánh đúng thực tế vì phụ thuộc B4.1 (điểm danh) chưa triển khai. FE cứ dùng field này bình thường, khi B4.1 xong giá trị sẽ tự đúng mà không đổi contract.
- `summary.totalRegistered` chỉ đếm `status = ACTIVE` (không tính các lượt đã huỷ).

---

## `B3.4` — Quản lý thông tin người tham gia (CRUD)

> **User story**: *Là ban tổ chức, tôi muốn quản lý thông tin người tham gia (CRUD) để giữ dữ liệu chính xác.*
> **Tiêu chí chấp nhận**: CRUD người tham gia có phân trang; validate họ tên/email/điện thoại; chặn trùng email; chặn xoá khi còn đăng ký hiệu lực
> **Ưu tiên**: Should · **Điểm**: 3 · **Module**: M3 · **Sprint**: Tuần 2 · **Phụ trách**: TV3 — M3 Đăng ký

### 📦 Backend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B3.4-T1` | `BE-SVC` | **Service quản lý người tham gia** | • Danh sách người tham gia = user có vai trò ROLE_USER<br>• `getParticipants(keyword, pageable)`, `getById`, `create`, `update`, `delete`<br>• Kèm `registeredEventCount` đếm bằng **một truy vấn group by** | 2 | ✅ Đã code (`ParticipantServiceImpl`, thêm `UserRepository.findByRoleNameAndKeyword` + `RegistrationRepository.countGroupedByUserIdsAndStatus`) |
| `B3.4-T2` | `BE-VAL` | **Validation người tham gia** | • fullName `@NotBlank`, email `@Email @NotBlank`, phone `@Pattern("^0\\d{9}$")`<br>• Trùng email → 409 `"Email đã tồn tại"`<br>• Chặn xoá khi còn đăng ký ACTIVE → 409 `"Không thể xoá: người này còn N lượt đăng ký"` | 2 | ✅ Đã code (`ParticipantReq`, `ParticipantServiceImpl.delete`) — có thêm `username @NotBlank @Size(4,50)` không có trong mô tả gốc, bắt buộc vì cột `username` trong bảng `users` là NOT NULL UNIQUE |
| `B3.4-T3` | `BE-API` | **API CRUD người tham gia** | • `GET /api/v1/participants?keyword=&page=&size=`<br>• `POST` / `PUT /{id}` / `DELETE /{id}` → chỉ ADMIN và ORGANIZER | 2 | ✅ Đã code (`ParticipantController`, `@PreAuthorize` cấp class áp dụng cho mọi endpoint kể cả `GET`) |
| `B3.4-T4` | `BE-TEST` | **Test case người tham gia** | • TC1: tạo trùng email → 409<br>• TC2: phone sai định dạng → 400<br>• TC3: xoá người còn đăng ký → 409 | 1 | ✅ Đã viết đủ 3 TC + vài TC bổ sung (trùng username, 404, USER bị 403) — 82/82 test pass |

### 🟩 Frontend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B3.4-T5` | `FE-UI` | **Trang quản lý người tham gia** | • Bảng: họ tên, email, SĐT, số sự kiện đã đăng ký, thao tác<br>• Modal thêm/sửa dùng chung | 2 | ⬜ Chưa làm |
| `B3.4-T6` | `FE-VAL` | **Validation & alert người tham gia** | • Kiểm tra client: bắt buộc họ tên, email đúng định dạng, SĐT 10 số<br>• Confirm trước khi xoá; hiện đúng message 409 từ backend | 1 | ⬜ Chưa làm |
| `B3.4-T7` | `FE-RES` | **Responsive trang người tham gia** | • Mobile: card list; modal full màn hình | 1 | ⬜ Chưa làm |

### Ghi chú bàn giao

- API đã chạy thật, 82/82 test pass. Response mẫu và mã lỗi đầy đủ ở `docs/api_contract.md` mục 14.
- FE cần gửi cả `username` khi tạo/sửa participant (form nên có ô này) dù mô tả gốc của story không nhắc tới — bắt buộc vì ràng buộc DB.
- Participant dùng chung bảng `users` với tài khoản Admin/Organizer — xoá participant chỉ xoá đúng bản ghi `ROLE_USER`, không ảnh hưởng tài khoản khác.

---

# Epic 4 — Điểm danh

## `B4.1` — Điểm danh (check-in) người tham gia

> **User story**: *Là ban tổ chức, tôi muốn điểm danh (check-in) người tham gia khi họ đến để biết ai thực sự có mặt.*
> **Tiêu chí chấp nhận**: Chỉ điểm danh lượt đăng ký ACTIVE của đúng sự kiện; lưu thời điểm và người thực hiện; không cho điểm danh trùng
> **Ưu tiên**: Must · **Điểm**: 5 · **Module**: M4 · **Sprint**: Tuần 2 · **Phụ trách**: TV4 — M4 Điểm danh

### 📦 Backend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B4.1-T1` | `BE-DB` | **Entity CheckInHistory** | • `CheckInHistory`: id, registration (OneToOne, **unique**), checkedBy (ManyToOne User), status, checkedInAt<br>• Ràng buộc unique trên `registration_id` → chống điểm danh trùng ngay ở tầng DB<br>• `CheckInStatus`: SUCCESS, ALREADY_CHECKED_IN, INVALID_TICKET, WRONG_EVENT | 2 | ✅ Đã code (chỉ lưu bản ghi khi `SUCCESS`; các trạng thái còn lại là kết quả trả về API, không lưu DB — quyết định thiết kế, xem ghi chú bàn giao) |
| `B4.1-T2` | `BE-REPO` | **CheckInHistoryRepository** | • `boolean existsByRegistrationId(Long)`<br>• `Optional<CheckInHistory> findByRegistrationId(Long)`<br>• `long countByRegistration_EventId(Long)` — đếm số người đã có mặt | 1 | ✅ Đã code, thêm `findCheckedInRegistrationIds(List<Long>)` (group cho cả trang, phục vụ B3.3) |
| `B4.1-T3` | `BE-SVC` | **Logic check-in** | • `@Transactional checkIn(registrationId, eventId, currentUser)`<br>• Không tìm thấy lượt đăng ký → `INVALID_TICKET` 404<br>• Lượt đăng ký thuộc sự kiện khác → `WRONG_EVENT` 400<br>• `status != ACTIVE` → từ chối `"Lượt đăng ký đã bị huỷ"`<br>• Đã có bản ghi điểm danh → `ALREADY_CHECKED_IN` 409, nêu rõ giờ đã check-in trước đó<br>• Hợp lệ → tạo bản ghi `SUCCESS` kèm `checkedInAt=now`, `checkedBy=người đang đăng nhập` | 3 | ✅ Đã code (`CheckInServiceImpl`) |
| `B4.1-T4` | `BE-API` | **API POST /check-in** | • `@PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")`<br>• Body `{ registrationId, eventId }`<br>• Trả `{ status, message, participantName, checkedInAt }` | 2 | ✅ Đã code (`CheckInController`) — nhánh lỗi trả theo `ErrorResponse` chung (`errorCode`), chỉ nhánh thành công dùng DTO `CheckInRes` riêng (xem ghi chú bàn giao) |
| `B4.1-T5` | `BE-TEST` | **Test case điểm danh** | • TC1: điểm danh hợp lệ → 200, DB có đúng 1 bản ghi<br>• TC2: điểm danh lần 2 cùng lượt đăng ký → 409, **không sinh thêm bản ghi nào**<br>• TC3: người chưa đăng ký → 404 INVALID_TICKET<br>• TC4: lượt đăng ký của sự kiện khác → 400 WRONG_EVENT<br>• TC5: lượt đăng ký đã huỷ → bị từ chối | 2 | ✅ Đã viết đủ 5 TC (`CheckInServiceTest`) + test quyền hạn qua MockMvc (`CheckInControllerTest`) — 91/91 test pass |

### 🟩 Frontend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B4.1-T6` | `FE-UI` | **Màn hình điểm danh** | • `checkInApi.ts`; bảng liệt kê toàn bộ đăng ký ACTIVE của sự kiện<br>• Mỗi dòng: họ tên, email, badge trạng thái (Chưa đến / Đã đến + giờ), nút `"Điểm danh"`<br>• Nút biến mất và badge đổi sang xanh ngay sau khi check-in | 3 | ⬜ Chưa làm |
| `B4.1-T7` | `FE-STATE` | **Cập nhật không tải lại toàn trang** | • Sau khi API trả về, cập nhật đúng phần tử trong mảng state (optimistic update)<br>• Trang giữ nguyên vị trí cuộn, **không nhảy về đầu danh sách**<br>• Gọi API thất bại → hoàn tác trạng thái dòng đó | 2 | ⬜ Chưa làm |
| `B4.1-T8` | `FE-ALERT` | **Alert kết quả điểm danh** | • SUCCESS → toast xanh `"✅ Điểm danh thành công — <Họ tên>"`<br>• ALREADY_CHECKED_IN → toast vàng `"Người này đã điểm danh lúc HH:mm"`<br>• INVALID_TICKET / WRONG_EVENT → toast đỏ | 1 | ⬜ Chưa làm |
| `B4.1-T9` | `FE-RES` | **Responsive màn hình điểm danh** | • Ưu tiên mobile vì thường dùng điện thoại tại cửa: mỗi người là 1 card, nút điểm danh to, cao ≥48px<br>• Ô tìm nhanh theo tên dính ở đầu màn hình | 1 | ⬜ Chưa làm |

### Ghi chú bàn giao

- API đã chạy thật, 91/91 test pass. Response mẫu và mã lỗi đầy đủ ở `docs/api_contract.md` mục 15.
- **Quyết định thiết kế**: `CheckInHistory` chỉ lưu bản ghi khi điểm danh **thành công** (status trong DB luôn là `SUCCESS`). Các trạng thái `ALREADY_CHECKED_IN`/`INVALID_TICKET`/`WRONG_EVENT` chỉ là giá trị trả về qua API (ném `BusinessException` kèm `errorCode`), không tạo bản ghi — vì mục đích của ràng buộc UNIQUE trên `registration_id` là chặn điểm danh trùng, không phải để lưu lịch sử các lần thử thất bại.
- Đã nối lại 2 chỗ đang ghi nợ TODO(B4.1) từ trước: `RegistrationServiceImpl.cancel()` (chặn huỷ khi đã điểm danh) và `getRegistrationsByEvent()` (field `checkedIn` giờ đúng dữ liệu thật). Cả 2 đã cập nhật lại trong `docs/api_contract.md` mục 12 và 13.
- B4.5 (mã QR/check-in nhanh bằng mã) là task `Could`, chưa làm — luồng điểm danh chính hiện tại dùng `registrationId` nhập bằng nút bấm/danh sách, đúng theo định hướng "khi cần" của bản v3.0.

---

## `B5.4` — Dashboard thống kê

> **User story**: *Là quản trị viên, tôi muốn xem dashboard thống kê (tổng sự kiện, sắp diễn ra, tổng lượt đăng ký, tỷ lệ điểm danh, top sự kiện đông) để nắm tình hình.*
> **Phụ trách**: TV5 – M5 Thống kê

### 🟦 Backend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B5.4-T1` | `BE-REPO` | **Truy vấn thống kê** | • Tổng sự kiện; sự kiện sắp diễn ra (`startAt > now`, status OPEN)<br>• Tổng lượt đăng ký ACTIVE; tổng lượt điểm danh<br>• Top 5 sự kiện nhiều đăng ký nhất (group by + order by desc + limit)<br>• Mỗi chỉ số **một truy vấn**, không lặp trong vòng lặp | 3 | ✅ Đã code — `EventRepository.countByStartAtAfterAndStatus`, `RegistrationRepository.countByStatus` + `findTopEventsGroupedByStatus`, dùng `count()` sẵn có cho tổng sự kiện/điểm danh |
| `B5.4-T2` | `BE-SVC` | **DashboardService** | • Gom thành `DashboardStatRes { totalEvents, upcomingEvents, totalRegistrations, totalCheckIns, attendanceRate }`<br>• `TopEventRes { eventId, eventName, capacity, registered, fillRate }` | 2 | ✅ Đã code — `DashboardService`/`DashboardServiceImpl` + `DashboardMapper`; `attendanceRate` qua `AttendanceRateUtil`, `fillRate` null khi capacity null; limit <=0 → 5, >100 → chặn 100 |
| `B5.4-T3` | `BE-API` | **API dashboard** | • `GET /api/v1/dashboard/summary` — ADMIN, ORGANIZER<br>• `GET /api/v1/dashboard/top-events?limit=5` | 2 | ✅ Đã code — `DashboardController` `@PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")` |
| `B5.4-T4` | `BE-TEST` | **Test case dashboard** | • TC1: số liệu khớp với đếm trực tiếp<br>• TC2: chưa có dữ liệu → tất cả 0, tỷ lệ 0%, không lỗi chia 0<br>• TC3: top-events sắp xếp giảm dần đúng | 2 | ✅ Đã viết — `DashboardServiceTest` (TC1/TC2/TC3 + fillRate null + limit) và `DashboardControllerTest` 200/403/401/limit |

### 🟩 Frontend (B5.4-T5/T6/T7)

| Mã task | Loại | Tên công việc | Chi tiết | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B5.4-T5` | `FE-UI` | **Trang dashboard** | `dashboardApi.ts` (đã có stub); 4 thẻ số liệu; bảng top 5 + thanh tỷ lệ; skeleton/empty | 3 | ⬜ Chưa làm — chờ Backend API |
| `B5.4-T6` | `FE-UI` | **Biểu đồ (tuỳ chọn)** | recharts BarChart từ JSON của API | 2 | ⬜ Chưa làm |
| `B5.4-T7` | `FE-RES` | **Responsive dashboard** | 1→2→4 cột; không tràn ngang | 1 | ⬜ Chưa làm |

### Ghi chú bàn giao

- Backend B5.4 đã test thật: **150/150 test pass** (thêm 5 `DashboardServiceTest` + 8 `DashboardControllerTest`). Hướng dẫn test API đầy đủ (folder Postman, url, JSON, mã lỗi) ở `docs/api_contract.md` mục 19 và mục 9 của backlog gốc.
- Hợp đồng JSON: `summary` → `{ totalEvents, upcomingEvents, totalRegistrations, totalCheckIns, attendanceRate }`; `top-events` → mảng `{ eventId, eventName, capacity, registered, fillRate }`. `attendanceRate`/`fillRate` làm tròn 1 chữ số; `fillRate = null` khi sự kiện chưa có capacity; `top-events` trả `[]` khi chưa có dữ liệu.

---

## `B5.5` — Xuất báo cáo theo khoảng thời gian

> **User story**: *Là quản trị viên, tôi muốn xuất báo cáo sự kiện/điểm danh theo khoảng thời gian để lưu trữ.*
> **Phụ trách**: TV5 – M5 Thống kê

### 🟦 Backend

| Mã task | Loại | Tên công việc | Chi tiết công việc phải làm | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B5.5-T1` | `BE-SVC` | **Tiện ích xuất CSV** | • `ExportCsvUtil` ghi CSV encoding UTF-8 có BOM để Excel không lỗi font tiếng Việt<br>• Cột: STT, tên sự kiện, thời gian, địa điểm, tổng đăng ký, có mặt, tỷ lệ tham dự | 2 | ✅ Đã code — `ExportCsvUtil.writeEventReport`, escape dấu phẩy/ngoặc kép theo chuẩn CSV (RFC 4180) |
| `B5.5-T2` | `BE-API` | **API xuất báo cáo** | • `GET /api/v1/reports/events/export?from=&to=`<br>• Header `Content-Type: text/csv`, `Content-Disposition: attachment; filename=bao-cao.csv`<br>• Chỉ ADMIN và ORGANIZER | 2 | ✅ Đã code — `ReportController`/`ReportService`/`ReportServiceImpl`; `from`/`to` bắt buộc, dùng lại `EventSpecification` (B5.2) để lọc theo `startAt`, dùng lại 2 truy vấn group-by có sẵn (B2.5/B4.3/B5.4) để tính tổng đăng ký/có mặt — không N+1 |
| `B5.5-T3` | `BE-TEST` | **Test case xuất báo cáo** | • TC1: số dòng CSV = số sự kiện trong khoảng thời gian<br>• TC2: mở file bằng Excel không lỗi font tiếng Việt | 1 | ✅ Đã viết — `ExportCsvUtilTest` (BOM, escape, số dòng, giữ đúng chữ tiếng Việt sau decode UTF-8), `ReportServiceTest` (TC1 + validate from/to + tính đúng tổng đăng ký/có mặt/tỷ lệ), `ReportControllerTest` (200/403/401 + đúng header response) |

### 🟩 Frontend (B5.5-T4)

| Mã task | Loại | Tên công việc | Chi tiết | Điểm | Trạng thái |
|---|---|---|---|---|---|
| `B5.5-T4` | `FE-UI` | **Giao diện xuất báo cáo** | Chọn khoảng thời gian + nút "Xuất CSV"; nhận blob rồi tạo link tải tự động; nút hiện loading trong lúc chờ; xong → toast "Đã tải báo cáo" | 1 | ⬜ Chưa làm — chờ Backend API |

### Ghi chú bàn giao

- Backend B5.5 đã test thật: **168/168 test pass** (thêm 4 `ExportCsvUtilTest` + 6 `ReportServiceTest` + 6 `ReportControllerTest`). Hợp đồng API đầy đủ (query params, header response, định dạng cột CSV, mã lỗi 400) ở `docs/api_contract.md` mục 20.
- `from`/`to` **bắt buộc** (khác B5.2 nơi 2 tham số này tuỳ chọn) — thiếu 1 trong 2 → 400 rõ message, không rơi vào 500.
- Response thành công là **file CSV** (`Content-Type: text/csv`), không phải JSON — FE bắt buộc gọi với `responseType: 'blob'`, không dùng `apiClient` mặc định nếu client đó ép `Accept: application/json`.
- File CSV có BOM UTF-8 ở đầu — mở trực tiếp bằng Excel (double-click) không bị lỗi font tiếng Việt.

