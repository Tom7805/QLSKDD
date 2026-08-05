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
