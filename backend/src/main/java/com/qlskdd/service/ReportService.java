package com.qlskdd.service;

// B5.5-T1/T2: xuất báo cáo sự kiện theo khoảng thời gian, dạng CSV.
public interface ReportService {

    // from/to nhận dạng thô yyyy-MM-dd (giống EventService.searchEvents ở B5.2) — service tự
    // parse + validate (thiếu tham số, sai định dạng, from > to -> 400), controller không nhảy
    // tầng validate. Trả về mảng byte CSV UTF-8 có BOM, sẵn sàng ghi thẳng vào response body.
    byte[] exportEventsCsv(String from, String to);
}
