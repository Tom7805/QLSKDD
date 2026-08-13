package com.qlskdd.util;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test case B5.5-T1: tiện ích xuất CSV.
 */
class ExportCsvUtilTest {

    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    /**
     * File CSV phải bắt đầu bằng BOM UTF-8 — điều kiện để Excel mở trực tiếp (double-click)
     * không lỗi font tiếng Việt (B5.5-T3 TC2, kiểm tra được tự động ở mức "có BOM + decode
     * đúng UTF-8", phần "mở thật bằng Excel" là kiểm thử thủ công bổ sung).
     */
    @Test
    void writeEventReport_LuonBatDauBangBomUtf8() {
        byte[] csv = ExportCsvUtil.writeEventReport(List.of());

        assertEquals(UTF8_BOM[0], csv[0]);
        assertEquals(UTF8_BOM[1], csv[1]);
        assertEquals(UTF8_BOM[2], csv[2]);
    }

    /**
     * Danh sách rỗng -> chỉ có dòng tiêu đề, không có dòng dữ liệu, không lỗi.
     */
    @Test
    void writeEventReport_DanhSachRong_ChiCoDongTieuDe() {
        byte[] csv = ExportCsvUtil.writeEventReport(List.of());
        String content = decode(csv);

        String[] lines = content.split("\r\n");
        assertEquals(1, lines.length);
        assertTrue(lines[0].contains("Tên sự kiện"));
    }

    /**
     * Số dòng dữ liệu CSV = số sự kiện truyền vào (B5.5-T3 TC1, ở mức util); chữ tiếng Việt
     * giữ nguyên sau khi decode UTF-8 (B5.5-T3 TC2, phần kiểm chứng tự động được).
     */
    @Test
    void writeEventReport_SoDongDuLieu_BangSoSuKienTruyenVao() {
        List<ExportCsvUtil.EventReportRow> rows = List.of(
                new ExportCsvUtil.EventReportRow("Hội thảo Trí tuệ nhân tạo",
                        LocalDateTime.of(2026, 3, 10, 8, 0), "Hội trường A", 60, 45, 75.0),
                new ExportCsvUtil.EventReportRow("Lễ hội Ẩm thực Việt Nam",
                        LocalDateTime.of(2026, 3, 15, 8, 0), "Sảnh chính", 30, 0, 0.0)
        );

        byte[] csv = ExportCsvUtil.writeEventReport(rows);
        String content = decode(csv);
        String[] lines = content.split("\r\n");

        assertEquals(3, lines.length); // 1 header + 2 dòng dữ liệu
        assertTrue(lines[1].contains("Hội thảo Trí tuệ nhân tạo"));
        assertTrue(lines[1].contains("10/03/2026 08:00"));
        assertTrue(lines[1].contains("Hội trường A"));
        assertTrue(lines[1].endsWith(",75.0"));
        assertTrue(lines[2].contains("Lễ hội Ẩm thực Việt Nam"));
        assertTrue(lines[2].endsWith(",0.0"));
    }

    /**
     * Tên sự kiện/địa điểm chứa dấu phẩy hoặc dấu ngoặc kép -> phải được bọc "..." và nhân
     * đôi dấu " bên trong (chuẩn CSV RFC 4180), không làm vỡ cột.
     */
    @Test
    void writeEventReport_TenChuaDauPhayVaNgoacKep_KhongVoCot() {
        List<ExportCsvUtil.EventReportRow> rows = List.of(
                new ExportCsvUtil.EventReportRow("Hội thảo \"AI, Blockchain\"",
                        LocalDateTime.of(2026, 1, 1, 0, 0), "Tầng 2, Toà A", 10, 5, 50.0)
        );

        byte[] csv = ExportCsvUtil.writeEventReport(rows);
        String content = decode(csv);
        String[] lines = content.split("\r\n");

        assertEquals(2, lines.length);
        assertTrue(lines[1].contains("\"Hội thảo \"\"AI, Blockchain\"\"\""));
        assertTrue(lines[1].contains("\"Tầng 2, Toà A\""));
    }

    private String decode(byte[] csv) {
        // Bỏ 3 byte BOM trước khi decode, giống cách trình đọc CSV/Excel thực tế xử lý.
        return new String(csv, 3, csv.length - 3, StandardCharsets.UTF_8);
    }
}
