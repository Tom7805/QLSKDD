package com.qlskdd.controller;

import com.qlskdd.config.SecurityConfig;
import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import com.qlskdd.service.AuthService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Key;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test case B1.2-T2: truy cập endpoint cần quyền sau khi đăng xuất.
 * Vì JWT là stateless, "đăng xuất" không huỷ token phía server, nên tiêu chí thực chất
 * là: request không kèm token, hoặc kèm token đã hết hạn, đều phải bị chặn 401.
 */
@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class, JwtProvider.class})
class AuthControllerTest {

    // Endpoint bất kỳ nằm ngoài "/api/v1/auth/**" (permitAll) để đại diện cho "endpoint cần quyền"
    private static final String PROTECTED_URL = "/api/v1/dashboard/summary";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    // JwtAuthFilter cần UserDetailsService để khởi tạo bean, nhưng cả 2 test case dưới đây
    // đều bị chặn trước khi filter kịp gọi tới nó (token thiếu hoặc đã hết hạn)
    @MockBean
    private UserDetailsService userDetailsService;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Test
    void goiEndpointCanQuyen_khongKemToken_traVe401() throws Exception {
        mockMvc.perform(get(PROTECTED_URL))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void goiEndpointCanQuyen_kemTokenDaHetHan_traVe401() throws Exception {
        String expiredToken = generateExpiredToken();

        mockMvc.perform(get(PROTECTED_URL).header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    private String generateExpiredToken() {
        Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        Date issuedAt = new Date(System.currentTimeMillis() - 20_000);
        Date expiredAt = new Date(System.currentTimeMillis() - 10_000);

        return Jwts.builder()
                .setSubject("admin")
                .setIssuedAt(issuedAt)
                .setExpiration(expiredAt)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
