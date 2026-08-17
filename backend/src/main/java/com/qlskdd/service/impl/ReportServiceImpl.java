package com.qlskdd.service.impl;

import com.qlskdd.entity.Event;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.service.ReportService;
import com.qlskdd.specification.EventSpecification;
import com.qlskdd.util.AttendanceRateUtil;
import com.qlskdd.util.ExportCsvUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// B5.5-T2: nghiệp vụ xuất báo cáo sự kiện theo khoảng thời gian.
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final CheckInHistoryRepository checkInHistoryRepository;

    @Override
    public byte[] exportEventsCsv(String from, String to) {
        LocalDate fromDate = parseRequiredDate(from, "from");
        LocalDate toDate = parseRequiredDate(to, "to");

        if (fromDate.isAfter(toDate)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Tham số from phải nhỏ hơn hoặc bằng to");
        }

        // B5.5-T1: dùng lại đúng EventSpecification của B5.2 (điều kiện from/to theo
        // startAt, [from 00:00:00, to 23:59:59]) — không viết lại logic lọc khoảng thời
        // gian ở một nơi khác. keyword/categoryId/status đều null -> chỉ lọc theo ngày.
        Specification<Event> spec = EventSpecification.filter(null, null, null, fromDate, toDate);
        List<Event> events = eventRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "startAt"));

        List<ExportCsvUtil.EventReportRow> rows = buildRows(events);
        return ExportCsvUtil.writeEventReport(rows);
    }

    // B2.5-T1/B4.3-T4 kiểu cũ: đếm tổng đăng ký ACTIVE và số đã điểm danh cho CẢ danh sách
    // sự kiện bằng đúng 2 truy vấn group by (không lặp truy vấn cho từng sự kiện — tránh N+1),
    // dùng lại chính 2 method group-by đã có sẵn từ B2.5/B4.3/B5.4.
    private List<ExportCsvUtil.EventReportRow> buildRows(List<Event> events) {
        List<Long> eventIds = events.stream().map(Event::getId).toList();
        Map<Long, Long> totalRegisteredByEventId = new HashMap<>();
        Map<Long, Long> presentByEventId = new HashMap<>();
        if (!eventIds.isEmpty()) {
            for (Object[] row : registrationRepository.countGroupedByEventIdsAndStatus(eventIds, RegistrationStatus.ACTIVE)) {
                totalRegisteredByEventId.put((Long) row[0], (Long) row[1]);
            }
            for (Object[] row : checkInHistoryRepository.countGroupedByEventIds(eventIds)) {
                presentByEventId.put((Long) row[0], (Long) row[1]);
            }
        }

        return events.stream()
                .map(event -> {
                    long totalRegistered = totalRegisteredByEventId.getOrDefault(event.getId(), 0L);
                    long present = presentByEventId.getOrDefault(event.getId(), 0L);
                    double attendanceRate = AttendanceRateUtil.calculate(present, totalRegistered);
                    return new ExportCsvUtil.EventReportRow(event.getName(), event.getStartAt(),
                            event.getLocation(), totalRegistered, present, attendanceRate);
                })
                .toList();
    }

    // B5.5-T2: from/to rỗng/null -> 400 (bắt buộc phải chọn khoảng thời gian trước khi
    // xuất báo cáo, khác với B5.2 nơi from/to là tuỳ chọn khi lọc danh sách).
    private LocalDate parseRequiredDate(String raw, String paramName) {
        if (raw == null || raw.isBlank()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn tham số " + paramName + " (định dạng yyyy-MM-dd)");
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Định dạng " + paramName + " phải là yyyy-MM-dd");
        }
    }
}
