package com.qlskdd.mapper;

import com.qlskdd.mapper.response.DashboardStatRes;
import com.qlskdd.mapper.response.TopEventRes;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

// B5.4-T2: mapper riêng cho module Dashboard — gom các tính toán từ repository (chỉ là tổng
// đếm + group by, không phải entity) thành DTO, đúng nguyên tắc "mapper không tự query DB".
// Mọi giá trị (count, attendanceRate, fillRate) được service tính/đếm rồi truyền vào đây.
@Component
public class DashboardMapper {

    public DashboardStatRes toSummary(long totalEvents, long upcomingEvents,
                                      long totalRegistrations, long totalCheckIns,
                                      double attendanceRate) {
        return DashboardStatRes.builder()
                .totalEvents(totalEvents)
                .upcomingEvents(upcomingEvents)
                .totalRegistrations(totalRegistrations)
                .totalCheckIns(totalCheckIns)
                .attendanceRate(attendanceRate)
                .build();
    }

    // Mỗi Object[] trong rows (từ RegistrationRepository.findTopEventsGroupedByStatus) có
    // đúng 4 cột: { eventId, eventName, capacity, registered } — giữ thứ tự đã sắp giảm dần.
    // fillRate = registered / capacity * 100 làm tròn 1 chữ số; capacity null/0 -> null.
    public List<TopEventRes> toTopEvents(List<Object[]> rows) {
        List<TopEventRes> result = new ArrayList<>();
        for (Object[] row : rows) {
            Long eventId = (Long) row[0];
            String eventName = (String) row[1];
            Integer capacity = (Integer) row[2];
            long registered = (Long) row[3];

            Double fillRate = (capacity != null && capacity > 0)
                    ? Math.round(registered * 1000.0 / capacity) / 10.0
                    : null;

            result.add(TopEventRes.builder()
                    .eventId(eventId)
                    .eventName(eventName)
                    .capacity(capacity)
                    .registered(registered)
                    .fillRate(fillRate)
                    .build());
        }
        return result;
    }
}

