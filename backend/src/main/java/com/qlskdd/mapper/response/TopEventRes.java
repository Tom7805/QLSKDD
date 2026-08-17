package com.qlskdd.mapper.response;

import lombok.Builder;
import lombok.Data;

// B5.4-T2: một dòng trong GET /api/v1/dashboard/top-events (bảng "top sự kiện đông người
// đăng ký"). fillRate = registered / capacity * 100 (làm tròn 1 chữ số); = null khi sự kiện
// chưa có capacity (dữ liệu seed B0.4) — FE hiển thị "—" thay vì chia 0.
@Data
@Builder
public class TopEventRes {
    private Long eventId;
    private String eventName;
    private Integer capacity;
    private long registered;
    private Double fillRate;
}
