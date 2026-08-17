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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

    // Test case B1.5-T3, TC2 — mật khẩu quá yếu chỉ có thể kiểm chứng ở tầng controller
    // vì @ValidPasswordChange chỉ thực thi khi request đi qua @Valid của Spring MVC,
    // giống lý do TC2 của B1.4-T5 ở trên test bằng MockMvc thay vì gọi thẳng service.
    private static final String CHANGE_PASSWORD_URL = "/api/v1/users/me/password";

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void doiMatKhau_TC2_MatKhauMoiQuaYeu_traVe400() throws Exception {
        String body = """
                {
                  "oldPassword": "matKhauCu123",
                  "newPassword": "yeu",
                  "confirmPassword": "yeu"
                }
                """;

        mockMvc.perform(put(CHANGE_PASSWORD_URL)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors[?(@.field == 'newPassword')]").exists());
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void doiMatKhau_MatKhauMoiTrungMatKhauCu_traVe400() throws Exception {
        String body = """
                {
                  "oldPassword": "matKhauCu123",
                  "newPassword": "matKhauCu123",
                  "confirmPassword": "matKhauCu123"
                }
                """;

        mockMvc.perform(put(CHANGE_PASSWORD_URL)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'newPassword')]").exists());
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void doiMatKhau_XacNhanKhongKhopMatKhauMoi_traVe400() throws Exception {
        String body = """
                {
                  "oldPassword": "matKhauCu123",
                  "newPassword": "matKhauMoi123",
                  "confirmPassword": "khongKhop123"
                }
                """;

        mockMvc.perform(put(CHANGE_PASSWORD_URL)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'confirmPassword')]").exists());
    }

    @Test
    void doiMatKhau_ChuaDangNhap_traVe401() throws Exception {
        mockMvc.perform(put(CHANGE_PASSWORD_URL).contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // Xác nhận SecurityConfig cho phép người dùng thường (không phải ADMIN) gọi được
    // endpoint này — khác với mọi endpoint /users/** khác vốn chỉ ADMIN mới gọi được.
    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void doiMatKhau_NguoiDungThuong_KhongBi403() throws Exception {
        String body = """
                {
                  "oldPassword": "matKhauCu123",
                  "newPassword": "matKhauMoi123",
                  "confirmPassword": "matKhauMoi123"
                }
                """;

        mockMvc.perform(put(CHANGE_PASSWORD_URL)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk());
    }
}
