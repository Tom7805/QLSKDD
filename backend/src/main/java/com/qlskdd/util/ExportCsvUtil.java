package com.qlskdd.util;

import com.qlskdd.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

// B5.5-T1: ghi CSV báo cáo sự kiện. Encoding UTF-8 CÓ BOM (3 byte EF BB BF ở đầu file) —
// thiếu BOM thì Excel tự đoán encoding và thường đoán sai (ra ISO-8859-1/Windows-1252),
// khiến chữ tiếng Việt bị lỗi font khi mở file trực tiếp bằng Excel (double-click), dù dữ
// liệu bên trong vẫn là UTF-8 hợp lệ.
public final class ExportCsvUtil {

    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String[] HEADERS = {
            "STT", "Tên sự kiện", "Thời gian", "Địa điểm", "Tổng đăng ký", "Có mặt", "Tỷ lệ tham dự (%)"
    };

    private ExportCsvUtil() {
    }

    // rows đã được service sắp đúng thứ tự cần xuất (theo startAt tăng dần) — util chỉ lo
    // phần định dạng CSV, không tự sắp xếp/lọc dữ liệu.
    public static byte[] writeEventReport(List<EventReportRow> rows) {
        try (ByteArrayOutputStream buffer = new ByteArrayOutputStream();
             Writer writer = new OutputStreamWriter(buffer, StandardCharsets.UTF_8)) {

            buffer.write(UTF8_BOM);
            writer.write(String.join(",", HEADERS));
            writer.write("\r\n");

            int stt = 1;
            for (EventReportRow row : rows) {
                writer.write(String.join(",",
                        String.valueOf(stt++),
                        escape(row.eventName()),
                        row.startAt() != null ? row.startAt().format(DATE_TIME_FORMAT) : "",
                        escape(row.location()),
                        String.valueOf(row.totalRegistered()),
                        String.valueOf(row.present()),
                        String.valueOf(row.attendanceRate())));
                writer.write("\r\n");
            }

            writer.flush();
            return buffer.toByteArray();
        } catch (IOException ex) {
            // ByteArrayOutputStream/OutputStreamWriter trong bộ nhớ không thực sự ném IOException
            // khi chạy — nhánh này chỉ để thoả kiểu try-with-resources, không phải luồng nghiệp vụ.
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo file báo cáo CSV");
        }
    }

    // Bọc mỗi giá trị chuỗi trong dấu " và nhân đôi dấu " bên trong (đúng chuẩn CSV RFC 4180)
    // — tránh vỡ cột khi tên sự kiện/địa điểm chứa dấu phẩy hoặc dấu ngoặc kép.
    private static String escape(String value) {
        if (value == null) {
            return "\"\"";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    // B5.5-T1: 1 dòng báo cáo — cột "Tổng đăng ký" là số lượt ACTIVE, "Có mặt" là số đã
    // điểm danh, "Tỷ lệ tham dự" = present/totalRegistered*100 (AttendanceRateUtil), do
    // ReportServiceImpl tính rồi truyền vào, util không tự tính lại.
    public record EventReportRow(String eventName, LocalDateTime startAt, String location,
                                  long totalRegistered, long present, double attendanceRate) {
    }
}
