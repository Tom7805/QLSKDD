package com.qlskdd.enums;

// B2.2-T1: 3 trạng thái cho bản cơ bản (không dùng DRAFT/FINISHED như bản Thymeleaf cũ)
public enum EventStatus {
    OPEN("Đang mở"),
    CLOSED("Đã đóng"),
    CANCELLED("Đã huỷ");

    private final String displayName;

    EventStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
