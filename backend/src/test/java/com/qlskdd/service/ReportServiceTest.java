package com.qlskdd.service;

import com.qlskdd.entity.Event;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.service.impl.ReportServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test case B5.5-T3 — Xuất báo cáo.
 * TC1: số dòng CSV = số sự kiện trong khoảng thời gian.
 * TC2 (phần tự động hoá được — mở thật bằng Excel là kiểm thử thủ công bổ sung): CSV giữ
 * đúng chữ tiếng Việt sau khi decode UTF-8 (xem thêm ExportCsvUtilTest).
 * Việc EventSpecification lọc đúng theo from/to đã được kiểm chứng riêng ở
 * EventSpecificationTest (B5.2) trên dữ liệu thật — ở đây chỉ mock kết quả trả về từ
 * repository để tập trung kiểm tra logic của ReportServiceImpl (validate, build CSV).
 */
@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private CheckInHistoryRepository checkInHistoryRepository;

    private ReportServiceImpl buildService() {
        return new ReportServiceImpl(eventRepository, registrationRepository, checkInHistoryRepository);
    }

    private Event buildEvent(long id, String name, LocalDateTime startAt, String location) {
        Event event = new Event();
        event.setId(id);
        event.setName(name);
        event.setStartAt(startAt);
        event.setEndAt(startAt.plusHours(2));
        event.setLocation(location);
        return event;
    }

    /**
     * TC1: 3 sự kiện trong khoảng thời gian -> CSV có đúng 3 dòng dữ liệu (không tính header).
     */
    @Test
    void testExportEventsCsv_TC1_SoDongCsv_BangSoSuKienTrongKhoangThoiGian() {
        List<Event> events = List.of(
                buildEvent(1L, "Hội thảo AI", LocalDateTime.of(2026, 3, 5, 8, 0), "Hội trường A"),
                buildEvent(2L, "Workshop React", LocalDateTime.of(2026, 3, 10, 8, 0), "Phòng Lab B"),
                buildEvent(3L, "Tiệc tri ân", LocalDateTime.of(2026, 3, 20, 8, 0), "Sảnh chính")
        );
        when(eventRepository.findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class)))
                .thenReturn(events);
        when(registrationRepository.countGroupedByEventIdsAndStatus(any(), eq(RegistrationStatus.ACTIVE)))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 60L}, new Object[]{2L, 20L}));
        when(checkInHistoryRepository.countGroupedByEventIds(any()))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 45L}));

        byte[] csv = buildService().exportEventsCsv("2026-03-01", "2026-03-31");
        String content = new String(csv, 3, csv.length - 3, StandardCharsets.UTF_8);
        String[] lines = content.split("\r\n");

        assertEquals(4, lines.length); // 1 header + 3 dòng dữ liệu
        assertEquals(3, events.size());
    }

    /**
     * TC2 (mức service): tổng đăng ký/có mặt/tỷ lệ tham dự tính đúng cho từng sự kiện, sự
     * kiện chưa ai đăng ký -> 0 và tỷ lệ 0.0 (không lỗi chia 0).
     */
    @Test
    void testExportEventsCsv_TinhDungTongDangKyCoMatTyLe() {
        List<Event> events = List.of(
                buildEvent(1L, "Hội thảo AI", LocalDateTime.of(2026, 3, 5, 8, 0), "Hội trường A"),
                buildEvent(2L, "Sự kiện chưa ai đăng ký", LocalDateTime.of(2026, 3, 6, 8, 0), "Phòng C")
        );
        when(eventRepository.findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class)))
                .thenReturn(events);
        when(registrationRepository.countGroupedByEventIdsAndStatus(any(), eq(RegistrationStatus.ACTIVE)))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 60L}));
        when(checkInHistoryRepository.countGroupedByEventIds(any()))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 45L}));

        byte[] csv = buildService().exportEventsCsv("2026-03-01", "2026-03-31");
        String content = new String(csv, 3, csv.length - 3, StandardCharsets.UTF_8);
        String[] lines = content.split("\r\n");

        assertTrue(lines[1].endsWith(",60,45,75.0"));
        assertTrue(lines[2].endsWith(",0,0,0.0"));
    }

    /**
     * Không có sự kiện nào trong khoảng thời gian -> CSV chỉ có header, không lỗi.
     */
    @Test
    void testExportEventsCsv_KhongCoSuKienNao_ChiCoHeader_KhongLoi() {
        when(eventRepository.findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class)))
                .thenReturn(Collections.emptyList());

        byte[] csv = buildService().exportEventsCsv("2026-01-01", "2026-01-31");
        String content = new String(csv, 3, csv.length - 3, StandardCharsets.UTF_8);

        assertEquals(1, content.split("\r\n").length);
        verify(registrationRepository, never()).countGroupedByEventIdsAndStatus(any(), any());
        verify(checkInHistoryRepository, never()).countGroupedByEventIds(any());
    }

    /**
     * B5.5-T2: thiếu tham số from hoặc to -> 400, không gọi repository.
     */
    @Test
    void testExportEventsCsv_ThieuFromHoacTo_Nem400() {
        BusinessException ex1 = assertThrows(BusinessException.class,
                () -> buildService().exportEventsCsv(null, "2026-03-31"));
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex1.getStatus());

        BusinessException ex2 = assertThrows(BusinessException.class,
                () -> buildService().exportEventsCsv("2026-03-01", ""));
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex2.getStatus());

        verify(eventRepository, never()).findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class));
    }

    /**
     * B5.5-T2: sai định dạng ngày (không phải yyyy-MM-dd) -> 400.
     */
    @Test
    void testExportEventsCsv_SaiDinhDangNgay_Nem400() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> buildService().exportEventsCsv("01-03-2026", "2026-03-31"));

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    /**
     * B5.5-T2: from sau to -> 400, không gọi repository.
     */
    @Test
    void testExportEventsCsv_FromSauTo_Nem400() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> buildService().exportEventsCsv("2026-04-01", "2026-03-01"));

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(eventRepository, never()).findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class));
    }
}
