package com.qlskdd.security;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.service.EventService;
import com.qlskdd.service.RegistrationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * B2.2/B2.3: quyền hạn theo role trên EventController. Ghi chú: trước đây PUT
 * /events/{id} còn kiểm tra thêm quyền sở hữu (ORGANIZER chỉ sửa được sự kiện do
 * chính mình tạo) qua EventSecurityService — rule này đã bỏ theo quyết định mới:
 * ADMIN và ORGANIZER đều quản lý được mọi sự kiện, không phân biệt người tạo.
 */
@WebMvcTest(controllers = com.qlskdd.controller.EventController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        JwtProvider.class})
class PermissionSecurityTest {

    private static final String EVENT_URL = "/api/v1/events";
    private static final DateTimeFormatter ISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    // B2.2: POST /events giờ cần @Valid @RequestBody EventReq hợp lệ mới invoke được
    // controller method (và do đó mới chạm tới @PreAuthorize) — trước đây stub không
    // nhận body nên test cũ gọi post(EVENT_URL) không kèm gì cũng qua được.
    private String validEventBody() {
        LocalDateTime start = LocalDateTime.now().plusDays(5).withNano(0);
        LocalDateTime end = start.plusHours(3);
        return """
                {
                  "name": "Hội thảo AI",
                  "location": "Hội trường A",
                  "capacity": 100,
                  "startAt": "%s",
                  "endAt": "%s",
                  "categoryId": 1
                }
                """.formatted(start.format(ISO), end.format(ISO));
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventService eventService;

    @MockBean
    private RegistrationService registrationService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void user_goiPostEvent_traVe403() throws Exception {
        mockMvc.perform(post(EVENT_URL).contentType("application/json").content(validEventBody()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void organizer_goiPostEvent_traVe201() throws Exception {
        mockMvc.perform(post(EVENT_URL).contentType("application/json").content(validEventBody()))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void organizer_suaSuKienCuaNguoiKhac_traVe200() throws Exception {
        // Không còn kiểm tra quyền sở hữu — ORGANIZER sửa được sự kiện của bất kỳ ai.
        mockMvc.perform(put(EVENT_URL + "/999").contentType("application/json").content(validEventBody()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void admin_goiMoiEndpoint_thanhCong() throws Exception {
        mockMvc.perform(post(EVENT_URL).contentType("application/json").content(validEventBody()))
                .andExpect(status().isCreated());

        mockMvc.perform(put(EVENT_URL + "/999").contentType("application/json").content(validEventBody()))
                .andExpect(status().isOk());
    }
}
