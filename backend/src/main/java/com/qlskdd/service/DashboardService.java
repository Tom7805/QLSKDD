package com.qlskdd.service;

import com.qlskdd.mapper.response.DashboardStatRes;
import com.qlskdd.mapper.response.TopEventRes;

import java.util.List;

// B5.4-T2: nghiệp vụ dashboard thống kê — gom số liệu tổng quan và top sự kiện đông đăng ký.
public interface DashboardService {

    DashboardStatRes getSummary();

    List<TopEventRes> getTopEvents(int limit);
}

