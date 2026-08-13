package com.qlskdd.service.impl;

import com.qlskdd.enums.EventStatus;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.mapper.DashboardMapper;
import com.qlskdd.mapper.response.DashboardStatRes;
import com.qlskdd.mapper.response.TopEventRes;
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.service.DashboardService;
import com.qlskdd.util.AttendanceRateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

// B5.4-T2: DashboardService — mỗi chỉ số đúng 1 truy vấn count/group by, không lặp trong
// vòng lặp (không N+1). attendanceRate nhờ AttendanceRateUtil xử lý an toàn mẫu số 0.
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final int DEFAULT_TOP_EVENTS_LIMIT = 5;
    private static final int MAX_TOP_EVENTS_LIMIT = 100;

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final CheckInHistoryRepository checkInHistoryRepository;
    private final DashboardMapper dashboardMapper;

    @Override
    public DashboardStatRes getSummary() {
        long totalEvents = eventRepository.count();
        long upcomingEvents = eventRepository.countByStartAtAfterAndStatus(LocalDateTime.now(), EventStatus.OPEN);
        long totalRegistrations = registrationRepository.countByStatus(RegistrationStatus.ACTIVE);
        long totalCheckIns = checkInHistoryRepository.count();
        double attendanceRate = AttendanceRateUtil.calculate(totalCheckIns, totalRegistrations);

        return dashboardMapper.toSummary(totalEvents, upcomingEvents, totalRegistrations, totalCheckIns, attendanceRate);
    }

    @Override
    public List<TopEventRes> getTopEvents(int limit) {
        // B5.4-T2: limit <= 0 (không hợp lệ) -> dùng mặc định 5; limit quá lớn -> chặn ở 100
        // để tránh query nặng khi FE truyền limit bất thường.
        int safeLimit = (limit > 0) ? Math.min(limit, MAX_TOP_EVENTS_LIMIT) : DEFAULT_TOP_EVENTS_LIMIT;

        // List + Pageable(0, safeLimit) -> Spring chỉ áp dụng LIMIT, không sinh count query
        List<Object[]> rows = registrationRepository
                .findTopEventsGroupedByStatus(RegistrationStatus.ACTIVE, PageRequest.of(0, safeLimit));

        return dashboardMapper.toTopEvents(rows);
    }
}

