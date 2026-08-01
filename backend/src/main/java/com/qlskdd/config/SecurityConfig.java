package com.qlskdd.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF vì chúng ta làm REST API thuần
            .csrf(csrf -> csrf.disable())
            // Kích hoạt CORS sử dụng cấu hình bên dưới
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Cấu hình phân quyền endpoint
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll() // Cho phép các api auth không cần đăng nhập nếu có
                .anyRequest().authenticated() // Các api còn lại phải xác thực
            )
            // Đặt Session ở trạng thái STATELESS (không lưu session trên server)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // Giữ lại HTTP Basic để test nhanh trên Postman như nãy
            .httpBasic(httpBasic -> {});

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Cho phép nguồn từ React app (thường chạy ở port 3000 hoặc 5173)
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
        // Cho phép các HTTP Method phổ biến
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Cho phép các Header
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}