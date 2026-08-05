package com.qlskdd.security;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.entity.Event;
import com.qlskdd.repository.EventRepository;
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
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = com.qlskdd.controller.EventController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        JwtProvider.class, EventSecurityService.class})
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
    private EventRepository eventRepository;

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
    void organizer_suaSuKienCuaNguoiKhac_traVe403() throws Exception {
        Event eventCuaNguoiKhac = new Event();
        eventCuaNguoiKhac.setId(999L);
        eventCuaNguoiKhac.setCreatedBy("another-organizer");
        when(eventRepository.findById(999L)).thenReturn(Optional.of(eventCuaNguoiKhac));

        mockMvc.perform(put(EVENT_URL + "/999").contentType("application/json").content(validEventBody()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void organizer_suaSuKienCuaChinhMinh_traVe200() throws Exception {
        Event eventCuaMinh = new Event();
        eventCuaMinh.setId(1000L);
        eventCuaMinh.setCreatedBy("organizer");
        when(eventRepository.findById(1000L)).thenReturn(Optional.of(eventCuaMinh));

        mockMvc.perform(put(EVENT_URL + "/1000").contentType("application/json").content(validEventBody()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void admin_goiMoiEndpoint_thanhCong() throws Exception {
        mockMvc.perform(post(EVENT_URL).contentType("application/json").content(validEventBody()))
                .andExpect(status().isCreated());

        // ADMIN không cần qua kiểm tra quyền sở hữu — sửa được sự kiện của bất kỳ ai
        mockMvc.perform(put(EVENT_URL + "/999").contentType("application/json").content(validEventBody()))
                .andExpect(status().isOk());
    }
}
