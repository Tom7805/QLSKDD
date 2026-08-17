package com.qlskdd.controller;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import com.qlskdd.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test case B5.5-T3 (phần chỉ kiểm tra được qua MockMvc: @PreAuthorize, header response).
 */
@WebMvcTest(controllers = ReportController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class, JwtProvider.class})
class ReportControllerTest {

    private static final String EXPORT_URL = "/api/v1/reports/events/export";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void xuatBaoCao_Admin_traVe200KemDungHeader() throws Exception {
        byte[] csv = "STT,Tên sự kiện\r\n".getBytes(StandardCharsets.UTF_8);
        when(reportService.exportEventsCsv("2026-03-01", "2026-03-31")).thenReturn(csv);

        mockMvc.perform(get(EXPORT_URL).param("from", "2026-03-01").param("to", "2026-03-31"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"bao-cao.csv\""));
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void xuatBaoCao_Organizer_traVe200() throws Exception {
        when(reportService.exportEventsCsv(any(), any())).thenReturn(new byte[0]);

        mockMvc.perform(get(EXPORT_URL).param("from", "2026-03-01").param("to", "2026-03-31"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void xuatBaoCao_UserThuong_traVe403() throws Exception {
        mockMvc.perform(get(EXPORT_URL).param("from", "2026-03-01").param("to", "2026-03-31"))
                .andExpect(status().isForbidden());
    }

    @Test
    void xuatBaoCao_ChuaDangNhap_traVe401() throws Exception {
        mockMvc.perform(get(EXPORT_URL).param("from", "2026-03-01").param("to", "2026-03-31"))
                .andExpect(status().isUnauthorized());
    }

    // Kiểm chứng wiring: BusinessException (thiếu from/to, sai định dạng, from>to) từ
    // service được GlobalExceptionHandler map đúng thành 400 kèm message.
    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void xuatBaoCao_FromSauTo_traVe400() throws Exception {
        when(reportService.exportEventsCsv("2026-04-01", "2026-03-01"))
                .thenThrow(new BusinessException(HttpStatus.BAD_REQUEST, "Tham số from phải nhỏ hơn hoặc bằng to"));

        mockMvc.perform(get(EXPORT_URL).param("from", "2026-04-01").param("to", "2026-03-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tham số from phải nhỏ hơn hoặc bằng to"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void xuatBaoCao_ThieuThamSo_traVe400() throws Exception {
        when(reportService.exportEventsCsv(null, null))
                .thenThrow(new BusinessException(HttpStatus.BAD_REQUEST,
                        "Vui lòng chọn tham số from (định dạng yyyy-MM-dd)"));

        mockMvc.perform(get(EXPORT_URL))
                .andExpect(status().isBadRequest());
    }
}
