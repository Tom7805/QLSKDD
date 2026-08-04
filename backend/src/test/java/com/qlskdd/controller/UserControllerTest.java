package com.qlskdd.controller;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import com.qlskdd.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test case B1.4-T5 phần TC2 — kiểm tra ở tầng controller vì @Valid chỉ thực thi khi
 * request đi qua Spring MVC, không thể test bằng cách gọi thẳng UserService.
 */
@WebMvcTest(controllers = UserController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        JwtProvider.class})
class UserControllerTest {

    private static final String USERS_URL = "/api/v1/users";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void taoTaiKhoan_TC2_EmailSaiDinhDang_traVe400KemTenTruongLoi() throws Exception {
        String body = """
                {
                  "username": "newuser",
                  "fullName": "Người dùng mới",
                  "email": "khong-phai-email",
                  "phone": "0912345678",
                  "roleId": 3,
                  "password": "password123"
                }
                """;

        mockMvc.perform(post(USERS_URL)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors[?(@.field == 'email')]").exists());
    }

    @Test
    void taoTaiKhoan_ChuaDangNhap_traVe401() throws Exception {
        mockMvc.perform(post(USERS_URL).contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void taoTaiKhoan_KhongPhaiAdmin_traVe403() throws Exception {
        mockMvc.perform(post(USERS_URL).contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
    }
}
