package com.qlskdd.controller;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import com.qlskdd.service.ParticipantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test case B3.4-T4 (phần chỉ kiểm tra được qua MockMvc: @PreAuthorize + @Valid).
 */
@WebMvcTest(controllers = ParticipantController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        JwtProvider.class})
class ParticipantControllerTest {

    private static final String PARTICIPANTS_URL = "/api/v1/participants";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ParticipantService participantService;

    @MockBean
    private UserDetailsService userDetailsService;

    private String validBody() {
        return """
                {
                  "username": "newuser",
                  "fullName": "Người dùng mới",
                  "email": "newuser@qlskdd.com",
                  "phone": "0912345678",
                  "password": "password123"
                }
                """;
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void xemDanhSach_Organizer_traVe200() throws Exception {
        mockMvc.perform(get(PARTICIPANTS_URL))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void xemDanhSach_Admin_traVe200() throws Exception {
        mockMvc.perform(get(PARTICIPANTS_URL))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void xemDanhSach_UserThuong_traVe403() throws Exception {
        mockMvc.perform(get(PARTICIPANTS_URL))
                .andExpect(status().isForbidden());
    }

    @Test
    void xemDanhSach_ChuaDangNhap_traVe401() throws Exception {
        mockMvc.perform(get(PARTICIPANTS_URL))
                .andExpect(status().isUnauthorized());
    }

    // TC2 (B3.4-T4): phone sai định dạng -> 400 — chỉ kiểm tra được qua MockMvc vì
    // @Pattern chỉ thực thi khi request đi qua @Valid của Spring MVC.
    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void taoNguoiThamGia_PhoneSaiDinhDang_traVe400() throws Exception {
        String body = """
                {
                  "username": "newuser",
                  "fullName": "Người dùng mới",
                  "email": "newuser@qlskdd.com",
                  "phone": "0912",
                  "password": "password123"
                }
                """;

        mockMvc.perform(post(PARTICIPANTS_URL).contentType("application/json").content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'phone')]").exists());
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void taoNguoiThamGia_UserThuong_traVe403() throws Exception {
        mockMvc.perform(post(PARTICIPANTS_URL).contentType("application/json").content(validBody()))
                .andExpect(status().isForbidden());
    }
}
