package com.qlskdd.controller;

import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.DashboardStatRes;
import com.qlskdd.mapper.response.TopEventRes;
import com.qlskdd.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// B5.4-T3: chỉ ADMIN và ORGANIZER xem được dashboard thống kê — người dùng thường (USER)
// nhận 403 ở mọi endpoint dưới đây (giống CheckInController). URL: /api/v1/dashboard.
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
public class DashboardController {

    private final DashboardService dashboardService;

    // GET /api/v1/dashboard/summary — 4 thẻ số liệu + tỷ lệ điểm danh toàn hệ thống
    @GetMapping("/summary")
    public ResponseEntity<BaseRes<DashboardStatRes>> getSummary() {
        DashboardStatRes result = dashboardService.getSummary();
        return ResponseEntity.ok(BaseRes.success("Lấy thống kê tổng quan thành công", result));
    }

    // GET /api/v1/dashboard/top-events?limit=5 — top sự kiện đông người đăng ký nhất
    @GetMapping("/top-events")
    public ResponseEntity<BaseRes<List<TopEventRes>>> getTopEvents(
            @RequestParam(defaultValue = "5") int limit) {
        List<TopEventRes> result = dashboardService.getTopEvents(limit);
        return ResponseEntity.ok(BaseRes.success("Lấy danh sách sự kiện đông người đăng ký thành công", result));
    }
}

