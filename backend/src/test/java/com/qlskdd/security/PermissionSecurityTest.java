package com.qlskdd.security;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.entity.Event;
import com.qlskdd.entity.Role;
import com.qlskdd.entity.User;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.service.EventService;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = com.qlskdd.controller.EventController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class, JwtProvider.class})
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
        mockMvc.perform(post(EVENT_URL + "/999"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void admin_goiMoiEndpoint_thanhCong() throws Exception {
        mockMvc.perform(post(EVENT_URL))
                .andExpect(status().isCreated());
    }
}
