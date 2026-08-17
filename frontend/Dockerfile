# ============================================================================
# Stage 1 — Build bundle tĩnh bằng Vite
# ============================================================================
FROM node:18-alpine AS build

WORKDIR /app

# Copy trước package*.json rồi mới `npm ci` để Docker cache layer cài đặt:
# sửa code React không làm cài lại toàn bộ node_modules.
# Dùng `npm ci` (không phải `npm install`): cài đúng theo package-lock.json, và fail ngay
# nếu package.json với lock file lệch nhau — đúng cái ta muốn biết ở CI.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# ĐIỂM QUAN TRỌNG NHẤT CỦA FILE NÀY:
# Vite thay biến `import.meta.env.VITE_*` vào bundle NGAY LÚC BUILD, rồi bundle thành file
# .js tĩnh. Nên KHÔNG thể truyền VITE_API_BASE_URL lúc `docker run` như biến môi trường của
# backend — làm vậy thì biến bị bỏ qua hoàn toàn, frontend vẫn gọi địa chỉ đã nhúng lúc build
# và trang trắng mà không có lỗi nào giải thích. Vì vậy nó phải là build ARG.
#
# Mặc định `/api/v1` là ĐƯỜNG DẪN TƯƠNG ĐỐI, không phải http://localhost:8080/api/v1:
# nginx ở stage 2 proxy /api/ sang backend, nên trình duyệt chỉ gọi về đúng origin đang mở.
# Cùng origin thì không phát sinh CORS — khỏi phải khai báo thêm origin nào ở backend.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# `npm run build` = `tsc -b && vite build` — lỗi kiểu TypeScript cũng làm build image thất bại,
# đúng mong muốn: không đóng gói bản có lỗi biên dịch.
RUN npm run build

# ============================================================================
# Stage 2 — Phục vụ file tĩnh bằng nginx
# ============================================================================
FROM nginx:alpine

# Ghi đè cấu hình mặc định: cần try_files cho React Router và proxy /api sang backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Dùng 127.0.0.1 chứ KHÔNG dùng `localhost`: trong container, /etc/hosts map `localhost` sang
# cả 127.0.0.1 và ::1, mà wget của busybox thử ::1 trước — còn nginx chỉ nghe IPv4 (0.0.0.0:80).
# Kết quả là healthcheck báo "Connection refused" và container bị đánh dấu unhealthy trong khi
# nginx vẫn phục vụ hoàn toàn bình thường từ bên ngoài. Đã gặp đúng lỗi này khi dựng stack.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
