package com.qlskdd.config;

import com.qlskdd.security.JwtAuthFilter;
import com.qlskdd.security.RestAccessDeniedHandler;
import com.qlskdd.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // Sửa hồ sơ phải đăng nhập — khai báo TRƯỚC permitAll của /auth/** để
                // khách vãng lai nhận 401 đúng chuẩn qua entry point, thay vì lọt vào
                // controller rồi mới ném lỗi
                .requestMatchers(HttpMethod.PUT, "/api/v1/auth/me").authenticated()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/**", "/api/v1/categories/**").permitAll()
                // Swagger UI và OpenAPI spec: trước đây thiếu 2 dòng này nên `anyRequest()
                // .authenticated()` ở dưới bắt luôn cả trang tài liệu -> mở Swagger UI bằng
                // trình duyệt trả 401, dù README và api_contract.md đều nói là mở được.
                // Trình duyệt không gửi kèm JWT (token nằm trong localStorage) nên không có
                // cách nào xem tài liệu trước khi mở quyền ở đây.
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/v3/api-docs").permitAll()
                // B1.5-T1: đổi mật khẩu của chính mình — phải khai báo TRƯỚC rule ADMIN bên
                // dưới vì Spring Security áp dụng luật khớp đầu tiên (first match wins), và
                // route này nằm trong "/api/v1/users/**" nhưng không giới hạn riêng ADMIN.
                .requestMatchers(HttpMethod.PUT, "/api/v1/users/me/password").authenticated()
                .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(restAuthenticationEntryPoint)
                .accessDeniedHandler(restAccessDeniedHandler)
            )
            // Đăng ký JwtAuthFilter chạy trước UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /*
     * B6.4-T4: danh sách origin đọc từ cấu hình chứ không ghi cứng trong code.
     *
     * Ghi cứng "localhost:5173" thì khi đóng gói Docker, frontend chạy sau nginx ở cổng 80/3000
     * nên mọi request bị CORS chặn — mà lỗi CORS hiện ở Console trình duyệt chứ không ở log
     * backend, rất mất thời gian truy. Mặc định vẫn là hai cổng dev để chạy ở máy không cần
     * cấu hình gì thêm; profile prod ghi đè bằng APP_CORS_ALLOWED_ORIGINS.
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private List<String> allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}