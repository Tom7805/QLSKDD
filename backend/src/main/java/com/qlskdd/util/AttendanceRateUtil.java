package com.qlskdd.util;

// B4.3-T1: công thức tỷ lệ tham dự dùng chung cho mọi nơi cần hiển thị (attendance-summary
// của B4.2, chi tiết sự kiện, dashboard sau này) — chỉ tính đúng 1 nơi để tránh mỗi chỗ tự
// làm tròn/xử lý mẫu số 0 một kiểu khác nhau.
public final class AttendanceRateUtil {

    private AttendanceRateUtil() {
    }

    // attendanceRate = present / totalRegistered * 100, làm tròn 1 chữ số thập phân.
    // totalRegistered = 0 (chưa có ai đăng ký) -> trả về 0.0, không chia cho 0.
    public static double calculate(long present, long totalRegistered) {
        if (totalRegistered == 0) {
            return 0.0;
        }
        return Math.round(present * 1000.0 / totalRegistered) / 10.0;
    }
}
