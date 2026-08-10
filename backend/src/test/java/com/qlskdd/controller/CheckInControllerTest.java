package com.qlskdd.controller;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.enums.CheckInStatus;
import com.qlskdd.mapper.response.CheckInRes;
import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import com.qlskdd.service.CheckInService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test case B4.1-T5 (phần chỉ kiểm tra được qua MockMvc: @PreAuthorize + @Valid).
 */
@WebMvcTest(controllers = CheckInController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        JwtProvider.class})
class CheckInControllerTest {

    private static final String CHECK_IN_URL = "/api/v1/check-in";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CheckInService checkInService;

    @MockBean
    private UserDetailsService userDetailsService;

    private String validBody() {
        return """
                {
                  "registrationId": 10,
                  "eventId": 1
                }
                """;
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void diemDanh_Organizer_traVe200() throws Exception {
        when(checkInService.checkIn(any(), any())).thenReturn(CheckInRes.builder()
                .status(CheckInStatus.SUCCESS)
                .message("Điểm danh thành công")
                .participantName("Nguyễn Văn A")
                .build());

        mockMvc.perform(post(CHECK_IN_URL).contentType("application/json").content(validBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void diemDanh_UserThuong_traVe403() throws Exception {
        mockMvc.perform(post(CHECK_IN_URL).contentType("application/json").content(validBody()))
                .andExpect(status().isForbidden());
    }

    @Test
    void diemDanh_ChuaDangNhap_traVe401() throws Exception {
        mockMvc.perform(post(CHECK_IN_URL).contentType("application/json").content(validBody()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void diemDanh_ThieuRegistrationId_traVe400() throws Exception {
        String body = """
                {
                  "eventId": 1
                }
                """;

        mockMvc.perform(post(CHECK_IN_URL).contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'registrationId')]").exists());
    }

    /**
     * Test case B4.5-T3 (phần chỉ kiểm tra được qua MockMvc: @PreAuthorize + @Valid).
     */
    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void diemDanhTheoMa_Organizer_traVe200() throws Exception {
        when(checkInService.checkInByCode(any(), any())).thenReturn(CheckInRes.builder()
                .status(CheckInStatus.SUCCESS)
                .message("Điểm danh thành công")
                .participantName("Nguyễn Văn A")
                .build());

        String body = """
                {
                  "code": "ABCD1234",
                  "eventId": 1
                }
                """;

        mockMvc.perform(post(CHECK_IN_URL + "/scan").contentType("application/json").content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void diemDanhTheoMa_UserThuong_traVe403() throws Exception {
        String body = """
                {
                  "code": "ABCD1234",
                  "eventId": 1
                }
                """;

        mockMvc.perform(post(CHECK_IN_URL + "/scan").contentType("application/json").content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void diemDanhTheoMa_ThieuCode_traVe400() throws Exception {
        String body = """
                {
                  "eventId": 1
                }
                """;

        mockMvc.perform(post(CHECK_IN_URL + "/scan").contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'code')]").exists());
    }
}
