package com.qlskdd.controller;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.security.EventSecurityService;
import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import com.qlskdd.exception.ResourceNotFoundException;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test case B2.2-T6 (TC2/TC3/TC4 tạo sự kiện) và B2.3-T3 (TC3/TC4 sửa sự kiện) — chỉ
 * kiểm tra được ở tầng controller vì @Valid (bao gồm @ValidEventTime) và @PreAuthorize
 * chỉ thực thi khi request đi qua Spring MVC, giống lý do TC2 của B1.4-T5 dùng MockMvc
 * thay vì gọi thẳng service.
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
    // PUT /events/{id}. Phải đặt name="eventSecurityService" tường minh — @MockBean
    // không tự đăng ký đúng tên bean theo tên field trong mọi trường hợp, và Spring
    // Security SpEL resolve bean theo đúng tên chuỗi trong "@eventSecurityService".
    @MockBean(name = "eventSecurityService")
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

    /**
     * Test case B2.3-T3.
     */
    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void suaSuKien_TC3_EndAtTruocStartAt_traVe400() throws Exception {
        when(eventSecurityService.canManageEvent("organizer", 1L)).thenReturn(true);

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

        mockMvc.perform(put(EVENTS_URL + "/1")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'endAt')]").exists());
    }

    @Test
    @WithMockUser(username = "organizer2", roles = "ORGANIZER")
    void suaSuKien_TC4_NguoiKhongPhaiChuSuKien_traVe403() throws Exception {
        // sự kiện id=1 do "organizer" tạo, ở đây "organizer2" cố sửa
        when(eventSecurityService.canManageEvent("organizer2", 1L)).thenReturn(false);

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

        mockMvc.perform(put(EVENTS_URL + "/1")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isForbidden());
    }

    /**
     * Test case B2.4-T3 (kiểm chứng wiring qua HTTP thật cho PATCH /events/{id}/status).
     */
    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void doiTrangThai_ThieuStatus_traVe400() throws Exception {
        when(eventSecurityService.canManageEvent("organizer", 1L)).thenReturn(true);

        mockMvc.perform(patch(EVENTS_URL + "/1/status")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'status')]").exists());
    }

    @Test
    @WithMockUser(username = "organizer2", roles = "ORGANIZER")
    void doiTrangThai_NguoiKhongPhaiChuSuKien_traVe403() throws Exception {
        when(eventSecurityService.canManageEvent("organizer2", 1L)).thenReturn(false);

        mockMvc.perform(patch(EVENTS_URL + "/1/status")
                        .contentType("application/json")
                        .content("{\"status\": \"CLOSED\"}"))
                .andExpect(status().isForbidden());
    }

    /**
     * Test case B2.5-T3, TC3 — kiểm chứng wiring HTTP thật cho GET /events/{id} (không
     * cần @WithMockUser vì permitAll).
     */
    @Test
    void layChiTietSuKien_KhongTonTai_traVe404() throws Exception {
        when(eventService.getById(999L)).thenThrow(new ResourceNotFoundException("Sự kiện", "id", 999L));

        mockMvc.perform(get(EVENTS_URL + "/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Sự kiện không tồn tại với id = '999'"));
    }

    private LocalDateTime future(long days) {
        return LocalDateTime.now().plusDays(days).withNano(0);
    }
}
