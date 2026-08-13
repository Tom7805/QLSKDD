package com.qlskdd.service;

import com.qlskdd.enums.EventStatus;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.mapper.DashboardMapper;
import com.qlskdd.mapper.response.DashboardStatRes;
import com.qlskdd.mapper.response.TopEventRes;
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Test case B5.4-T4 — Dashboard thống kê.
 * TC1: số liệu khớp với đếm trực tiếp + attendanceRate đúng công thức.
 * TC2: hệ thống chưa có dữ liệu -> tất cả bằng 0, tỷ lệ 0.0, không lỗi chia 0.
 * TC3: top-events sắp xếp giảm dần đúng (đông nhất đứng đầu), fillRate đúng 1 chữ số.
 * Thêm: sự kiện không có capacity -> fillRate = null; limit không hợp lệ -> mặc định 5 / chặn 100.
 */
@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private CheckInHistoryRepository checkInHistoryRepository;

    private final DashboardMapper dashboardMapper = new DashboardMapper();

    private DashboardServiceImpl buildService() {
        return new DashboardServiceImpl(eventRepository, registrationRepository, checkInHistoryRepository, dashboardMapper);
    }

    /**
     * TC1: có dữ liệu -> mọi chỉ số đúng bằng khớp với đếm trực tiếp, attendanceRate = 12/40*100 = 30.0.
     */
    @Test
    void testSummary_CoDuLieu_TinhDungTatCaChiSo() {
        when(eventRepository.count()).thenReturn(10L);
        when(eventRepository.countByStartAtAfterAndStatus(ArgumentMatchers.any(), ArgumentMatchers.eq(EventStatus.OPEN)))
                .thenReturn(3L);
        when(registrationRepository.countByStatus(RegistrationStatus.ACTIVE)).thenReturn(40L);
        when(checkInHistoryRepository.count()).thenReturn(12L);

        DashboardStatRes res = buildService().getSummary();

        assertEquals(10L, res.getTotalEvents());
        assertEquals(3L, res.getUpcomingEvents());
        assertEquals(40L, res.getTotalRegistrations());
        assertEquals(12L, res.getTotalCheckIns());
        assertEquals(30.0, res.getAttendanceRate());
    }


    /**
     * TC2: chưa có dữ liệu -> tất cả bằng 0, attendanceRate 0.0 (AttendanceRateUtil không chia 0).
     */
    @Test
    void testSummary_KhongCoDuLieu_TatCaBangKhongVaKhongLoiChia0() {
        when(eventRepository.count()).thenReturn(0L);
        when(eventRepository.countByStartAtAfterAndStatus(ArgumentMatchers.any(), ArgumentMatchers.eq(EventStatus.OPEN)))
                .thenReturn(0L);
        when(registrationRepository.countByStatus(RegistrationStatus.ACTIVE)).thenReturn(0L);
        when(checkInHistoryRepository.count()).thenReturn(0L);

        DashboardStatRes res = buildService().getSummary();

        assertEquals(0L, res.getTotalEvents());
        assertEquals(0L, res.getUpcomingEvents());
        assertEquals(0L, res.getTotalRegistrations());
        assertEquals(0L, res.getTotalCheckIns());
        assertEquals(0.0, res.getAttendanceRate());
    }

    /**
     * TC3: top-events giữ đúng thứ tự giảm dần do repository trả về, fillRate tính đúng 1 chữ số.
     */
    @Test
    void testTopEvents_SapXepGiamDanVaFillRateDung() {
        List<Object[]> rows = List.of(
                new Object[]{1L, "Hội thảo AI", 100, 80L},
                new Object[]{2L, "Lễ ra mắt sản phẩm", 50, 45L},
                new Object[]{3L, "Khóa đào tạo kỹ năng", 200, 10L}
        );
        when(registrationRepository.findTopEventsGroupedByStatus(
                ArgumentMatchers.eq(RegistrationStatus.ACTIVE), ArgumentMatchers.any())).thenReturn(rows);

        List<TopEventRes> result = buildService().getTopEvents(3);

        assertEquals(3, result.size());
        // đông nhất (80 ĐK) đứng đầu, giảm dần
        assertEquals(1L, result.get(0).getEventId());
        assertEquals("Hội thảo AI", result.get(0).getEventName());
        assertEquals(80L, result.get(0).getRegistered());
        assertEquals(80.0, result.get(0).getFillRate());   // 80/100*100 = 80.0
        assertEquals(2L, result.get(1).getEventId());
        assertEquals(90.0, result.get(1).getFillRate());   // 45/50*100 = 90.0
        assertEquals(3L, result.get(2).getEventId());
        assertEquals(5.0, result.get(2).getFillRate());    // 10/200*100 = 5.0
    }

    /**
     * B5.4-T2 phòng thủ: sự kiện chưa có capacity (seed cũ) -> fillRate = null, không lỗi chia 0.
     */
    @Test
    void testTopEvents_CapacityNull_FillRateNull() {
        List<Object[]> rows = List.<Object[]>of(new Object[]{9L, "Sự kiện chưa set sức chứa", null, 5L});
        when(registrationRepository.findTopEventsGroupedByStatus(
                ArgumentMatchers.eq(RegistrationStatus.ACTIVE), ArgumentMatchers.any())).thenReturn(rows);

        List<TopEventRes> result = buildService().getTopEvents(5);

        assertEquals(1, result.size());
        assertEquals(5L, result.get(0).getRegistered());
        assertNull(result.get(0).getCapacity());
        assertNull(result.get(0).getFillRate());
    }

    /**
     * B5.4-T2 phòng thủ: limit <= 0 -> dùng mặc định 5; limit quá lớn -> chặn ở 100.
     */
    @Test
    void testTopEvents_LimitKhongHopLe_DungMacDinhHoacChanTrai() {
        // limit <= 0 -> mặc định 5
        when(registrationRepository.findTopEventsGroupedByStatus(ArgumentMatchers.eq(RegistrationStatus.ACTIVE),
                ArgumentMatchers.argThat(p -> p.getPageSize() == 5))).thenReturn(List.of());
        assertTrue(buildService().getTopEvents(0).isEmpty());
        assertTrue(buildService().getTopEvents(-3).isEmpty());

        // limit quá lớn -> chặn ở 100
        when(registrationRepository.findTopEventsGroupedByStatus(ArgumentMatchers.eq(RegistrationStatus.ACTIVE),
                ArgumentMatchers.argThat(p -> p.getPageSize() == 100))).thenReturn(List.of());
        assertTrue(buildService().getTopEvents(500).isEmpty());
    }
}

