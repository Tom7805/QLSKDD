package com.qlskdd.mapper.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

// B4.2-T2/T3: response của GET /api/v1/events/{id}/attendance-summary.
@Data
@Builder
public class AttendanceSummaryRes {
    private AttendanceSummary summary;
    private List<AttendanceItemRes> present;
    private List<AttendanceItemRes> absent;
}
