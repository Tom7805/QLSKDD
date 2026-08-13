package com.qlskdd.controller;

import com.qlskdd.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// B5.5-T2: chỉ ADMIN và ORGANIZER xuất được báo cáo — người dùng thường (USER) nhận 403.
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
public class ReportController {

    private final ReportService reportService;

    // GET /api/v1/reports/events/export?from=&to= — tải file CSV danh sách sự kiện trong
    // khoảng thời gian, kèm tổng đăng ký/có mặt/tỷ lệ tham dự từng sự kiện.
    @GetMapping("/events/export")
    public ResponseEntity<byte[]> exportEvents(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        byte[] csv = reportService.exportEventsCsv(from, to);

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("bao-cao.csv")
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(csv);
    }
}
