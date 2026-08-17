# ============================================================================
# Stage 1 — Build jar bằng Maven
# ============================================================================
# CỐ Ý dùng image `maven:...` và gọi `mvn`, KHÔNG dùng `./mvnw` như khi chạy ở máy:
# repo này phát triển trên Windows nên file `mvnw` rất dễ bị lưu với kết thúc dòng CRLF.
# Trong container Linux, shell đọc dòng `#!/bin/sh\r` và báo "no such file or directory" —
# một lỗi cực khó đoán vì nội dung file trông hoàn toàn bình thường. Image maven đã có sẵn
# maven đúng phiên bản nên tránh được hẳn vấn đề đó.
FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /build

# Copy TRƯỚC chỉ pom.xml rồi tải dependency, sau đó mới copy src/.
# Nhờ vậy Docker cache lại layer dependency: sửa code Java không làm tải lại toàn bộ
# thư viện Maven (vài trăm MB), build lần 2 trở đi nhanh hơn rất nhiều.
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

COPY src/ ./src/

# Bỏ qua test ở bước build image: test đã chạy ở CI (B6.5) và ở máy dev.
# Chạy lại trong image chỉ làm build chậm mà không thêm bảo đảm nào.
RUN mvn -B -q clean package -DskipTests

# ============================================================================
# Stage 2 — Image chạy thật, chỉ giữ đúng file jar
# ============================================================================
# JRE (không phải JDK) và chọn đúng Java 17 khớp <java.version> trong pom.xml —
# không lấy "bản mới nhất" vì Spring Boot 3.2 chưa kiểm chứng trên các bản Java mới hơn.
FROM eclipse-temurin:17-jre-alpine

# Chạy bằng user thường, không phải root: nếu ứng dụng bị chiếm quyền thì kẻ tấn công
# cũng không có quyền root trong container.
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
RUN chown spring:spring /app/app.jar
USER spring

EXPOSE 8080

# Dùng chính endpoint công khai GET /api/v1/events làm mốc "đã sẵn sàng": nó đi hết chuỗi
# Controller -> Service -> Repository -> MySQL, nên trả 200 tức là cả app lẫn kết nối DB
# đều sống. Dự án không có spring-boot-starter-actuator nên không dùng /actuator/health.
# start-period 60s vì lần khởi động đầu Hibernate còn phải tạo schema.
#
# Dùng 127.0.0.1 chứ KHÔNG dùng `localhost`: trong container, /etc/hosts map `localhost` sang
# cả 127.0.0.1 và ::1, mà wget của busybox có thể thử ::1 trước — còn Tomcat chỉ nghe IPv4.
# Container frontend đã bị đánh dấu unhealthy đúng vì lý do này dù nginx phục vụ bình thường.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -q --spider http://127.0.0.1:8080/api/v1/events || exit 1

# Tham số JVM chọn cho máy NHỎ và CHẬM (gói free của Render: 512MB RAM, 1 CPU chia sẻ) —
# ở đó khởi động nhanh quan trọng hơn thông lượng đỉnh:
#
# MaxRAMPercentage=65  Giới hạn heap theo % RAM container thay vì số cứng. Để 75% trên máy
#                      512MB thì chỉ còn ~128MB cho metaspace, thread stack và bộ nhớ ngoài
#                      heap — quá sát, dễ bị hệ điều hành giết vì hết RAM.
# UseSerialGC          G1 (mặc định) dựng nhiều thread GC và tốn thời gian khởi tạo; trên
#                      container 1 CPU thì nó vừa chậm hơn vừa tốn RAM hơn Serial.
# TieredStopAtLevel=1  Chỉ dùng JIT tầng 1: biên dịch nhanh, bỏ tối ưu sâu. Đổi thông lượng
#                      đỉnh lấy thời gian khởi động — đúng thứ cần khi Render có hạn giờ quét
#                      cổng, và khi instance free ngủ dậy phải khởi động lại từ đầu.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=65", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-jar", "/app/app.jar"]
