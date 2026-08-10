package com.qlskdd.controller;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.security.RegistrationSecurityService;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import com.qlskdd.service.RegistrationService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test case B4.5-T2 (phần chỉ kiểm tra được qua MockMvc: @PreAuthorize kết hợp
 * hasAnyRole/isOwner).
 */
@WebMvcTest(controllers = RegistrationController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        JwtProvider.class})
class RegistrationControllerTest {

    private static final String QR_URL = "/api/v1/registrations/15/qr";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RegistrationService registrationService;

    @MockBean
    private UserDetailsService userDetailsService;

    // RegistrationController dùng @registrationSecurityService trong SpEL của @PreAuthorize
    // — phải đặt name tường minh giống pattern @eventSecurityService ở EventControllerTest.
    @MockBean(name = "registrationSecurityService")
    private RegistrationSecurityService registrationSecurityService;

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void xemQr_ChuVe_traVe200() throws Exception {
        when(registrationSecurityService.isOwner("user1", 15L)).thenReturn(true);
        when(registrationService.generateQrCode(any())).thenReturn(new byte[]{1, 2, 3});

        mockMvc.perform(get(QR_URL)).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void xemQr_Organizer_traVe200() throws Exception {
        when(registrationService.generateQrCode(any())).thenReturn(new byte[]{1, 2, 3});

        mockMvc.perform(get(QR_URL)).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "nguoi_khac", roles = "USER")
    void xemQr_NguoiKhacKhongPhaiChuVe_traVe403() throws Exception {
        when(registrationSecurityService.isOwner("nguoi_khac", 15L)).thenReturn(false);

        mockMvc.perform(get(QR_URL)).andExpect(status().isForbidden());
    }
}
