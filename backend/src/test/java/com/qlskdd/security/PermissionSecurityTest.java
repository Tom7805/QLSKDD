package com.qlskdd.security;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.entity.Event;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.service.EventService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

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

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventService eventService;

    @MockBean
    private EventRepository eventRepository;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void user_goiPostEvent_traVe403() throws Exception {
        mockMvc.perform(post(EVENT_URL))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void organizer_goiPostEvent_traVe201() throws Exception {
        mockMvc.perform(post(EVENT_URL))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void organizer_suaSuKienCuaNguoiKhac_traVe403() throws Exception {
        Event eventCuaNguoiKhac = new Event();
        eventCuaNguoiKhac.setId(999L);
        eventCuaNguoiKhac.setCreatedBy("another-organizer");
        when(eventRepository.findById(999L)).thenReturn(Optional.of(eventCuaNguoiKhac));

        mockMvc.perform(put(EVENT_URL + "/999"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "organizer", roles = "ORGANIZER")
    void organizer_suaSuKienCuaChinhMinh_traVe200() throws Exception {
        Event eventCuaMinh = new Event();
        eventCuaMinh.setId(1000L);
        eventCuaMinh.setCreatedBy("organizer");
        when(eventRepository.findById(1000L)).thenReturn(Optional.of(eventCuaMinh));

        mockMvc.perform(put(EVENT_URL + "/1000"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void admin_goiMoiEndpoint_thanhCong() throws Exception {
        mockMvc.perform(post(EVENT_URL))
                .andExpect(status().isCreated());

        // ADMIN không cần qua kiểm tra quyền sở hữu — sửa được sự kiện của bất kỳ ai
        mockMvc.perform(put(EVENT_URL + "/999"))
                .andExpect(status().isOk());
    }
}
