package com.qlskdd.enums;

// B4.1-T1: chỉ có bản ghi CheckInHistory khi status=SUCCESS (điểm danh hợp lệ).
// Các giá trị còn lại là kết quả trả về của API POST /check-in cho các nhánh bị từ
// chối (ALREADY_CHECKED_IN/INVALID_TICKET/WRONG_EVENT), không được lưu vào DB.
public enum CheckInStatus {
    SUCCESS, ALREADY_CHECKED_IN, INVALID_TICKET, WRONG_EVENT
}
