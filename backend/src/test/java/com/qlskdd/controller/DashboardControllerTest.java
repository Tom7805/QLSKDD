package com.qlskdd.controller;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.mapper.response.DashboardStatRes;
import com.qlskdd.mapper.response.TopEventRes;
import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import com.qlskdd.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test case B5.4-T4 — phần chỉ kiểm tra được qua MockMvc: @PreAuthorize (ADMIN/ORGANIZER
 * được phép, USER bị 403, khách 401) và mapping param limit -> service.
 */
@WebMvcTest(controllers = DashboardController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class, JwtProvider.class})
class DashboardControllerTest {

    private static final String SUMMARY_URL = "/api/v1/dashboard/summary";
    private static final String TOP_EVENTS_URL = "/api/v1/dashboard/top-events";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void summary_Admin_traVe200VaDuLieuDung() throws Exception {
        when(dashboardService.getSummary()).thenReturn(DashboardStatRes.builder()
                .totalEvents(10)
                .upcomingEvents(3)
                .totalRegistrations(40)
                .totalCheckIns(12)
                .attendanceRate(30.0)
                .build());

        mockMvc.perform(get(SUMMARY_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalEvents").value(10))
                .andExpect(jsonPath("$.data.upcomingEvents").value(3))
                .andExpect(jsonPath("$.data.totalRegistrations").value(40))
                .andExpect(jsonPath("$.data.totalCheckIns").value(12))
                .andExpect(jsonPath("$.data.attendanceRate").value(30.0));
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void summary_Organizer_traVe200() throws Exception {
        when(dashboardService.getSummary()).thenReturn(DashboardStatRes.builder().totalEvents(0).build());
        mockMvc.perform(get(SUMMARY_URL)).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void summary_UserThuong_traVe403() throws Exception {
        mockMvc.perform(get(SUMMARY_URL)).andExpect(status().isForbidden());
    }

    @Test
    void summary_ChuaDangNhap_traVe401() throws Exception {
        mockMvc.perform(get(SUMMARY_URL)).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void topEvents_TruyenLimit_traVe200VaDuLieuDung() throws Exception {
        when(dashboardService.getTopEvents(3)).thenReturn(List.of(
                TopEventRes.builder()
                        .eventId(1L)
                        .eventName("Hội thảo AI")
                        .capacity(100)
                        .registered(80L)
                        .fillRate(80.0)
                        .build()
        ));

        mockMvc.perform(get(TOP_EVENTS_URL).param("limit", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].eventName").value("Hội thảo AI"))
                .andExpect(jsonPath("$.data[0].registered").value(80))
                .andExpect(jsonPath("$.data[0].fillRate").value(80.0));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void topEvents_KhongTruyenLimit_MacDinh5() throws Exception {
        when(dashboardService.getTopEvents(5)).thenReturn(List.of());
        mockMvc.perform(get(TOP_EVENTS_URL)).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void topEvents_UserThuong_traVe403() throws Exception {
        mockMvc.perform(get(TOP_EVENTS_URL)).andExpect(status().isForbidden());
    }

    @Test
    void topEvents_ChuaDangNhap_traVe401() throws Exception {
        mockMvc.perform(get(TOP_EVENTS_URL)).andExpect(status().isUnauthorized());
    }
}
