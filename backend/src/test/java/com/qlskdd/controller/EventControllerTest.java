package com.qlskdd.controller;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.security.EventSecurityService;
import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import com.qlskdd.service.EventService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test case B2.2-T6, phần TC2/TC3/TC4 — chỉ kiểm tra được ở tầng controller vì
 * @Valid (bao gồm @ValidEventTime) chỉ thực thi khi request đi qua Spring MVC,
 * giống lý do TC2 của B1.4-T5 dùng MockMvc thay vì gọi thẳng service.
 */
@WebMvcTest(controllers = EventController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        JwtProvider.class})
class EventControllerTest {

    private static final String EVENTS_URL = "/api/v1/events";
    private static final DateTimeFormatter ISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventService eventService;

    @MockBean
    private UserDetailsService userDetailsService;

    // EventController dùng @eventSecurityService trong SpEL của @PreAuthorize cho
    // PUT /events/{id} — không dùng ở test này nhưng WebMvcTest vẫn cần bean để khởi
    // tạo được ApplicationContext.
    @MockBean
    private EventSecurityService eventSecurityService;

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void taoSuKien_TC2_ThieuName_traVe400KemTenTruongLoi() throws Exception {
        String body = """
                {
                  "location": "Hội trường A",
                  "capacity": 100,
                  "startAt": "%s",
                  "endAt": "%s",
                  "categoryId": 1
                }
                """.formatted(future(5).format(ISO), future(5).plusHours(3).format(ISO));

        mockMvc.perform(post(EVENTS_URL)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors[?(@.field == 'name')]").exists());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void taoSuKien_TC3_CapacityBangKhong_traVe400() throws Exception {
        String body = """
                {
                  "name": "Hội thảo AI",
                  "location": "Hội trường A",
                  "capacity": 0,
                  "startAt": "%s",
                  "endAt": "%s",
                  "categoryId": 1
                }
                """.formatted(future(5).format(ISO), future(5).plusHours(3).format(ISO));

        mockMvc.perform(post(EVENTS_URL)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'capacity')]").exists());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void taoSuKien_TC4_EndAtTruocStartAt_traVe400DungMessage() throws Exception {
        String body = """
                {
                  "name": "Hội thảo AI",
                  "location": "Hội trường A",
                  "capacity": 100,
                  "startAt": "%s",
                  "endAt": "%s",
                  "categoryId": 1
                }
                """.formatted(future(5).format(ISO), future(5).minusHours(1).format(ISO));

        mockMvc.perform(post(EVENTS_URL)
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'endAt')].message")
                        .value("Thời gian kết thúc phải sau thời gian bắt đầu"));
    }

    @Test
    void taoSuKien_ChuaDangNhap_traVe401() throws Exception {
        mockMvc.perform(post(EVENTS_URL).contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void taoSuKien_KhongPhaiAdminHoacOrganizer_traVe403() throws Exception {
        // Phải gửi body hợp lệ: @Valid chạy lúc Spring MVC resolve tham số @RequestBody,
        // TRƯỚC khi @PreAuthorize (AOP quanh lời gọi method) kịp chặn — body rỗng sẽ bị
        // chặn ở bước validate (400) trước khi tới được bước kiểm tra quyền (403).
        String body = """
                {
                  "name": "Hội thảo AI",
                  "location": "Hội trường A",
                  "capacity": 100,
                  "startAt": "%s",
                  "endAt": "%s",
                  "categoryId": 1
                }
                """.formatted(future(5).format(ISO), future(5).plusHours(3).format(ISO));

        mockMvc.perform(post(EVENTS_URL).contentType("application/json").content(body))
                .andExpect(status().isForbidden());
    }

    private LocalDateTime future(long days) {
        return LocalDateTime.now().plusDays(days).withNano(0);
    }
}
