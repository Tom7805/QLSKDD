package com.qlskdd.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtProviderTest {

    private JwtProvider jwtProvider;

    private final String secretKey = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long expirationMs = 86400000L;

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider();
        // Inject giá trị cấu hình @Value thủ công qua Reflection cho unit test độc lập
        ReflectionTestUtils.setField(jwtProvider, "jwtSecret", secretKey);
        ReflectionTestUtils.setField(jwtProvider, "jwtExpirationDate", expirationMs);
    }

    @Test
    void testTC5_GenerateAndValidateToken_Success() {
        // Given
        Authentication auth = new UsernamePasswordAuthenticationToken("admin", "password", Collections.emptyList());

        // When: Sinh token
        String token = jwtProvider.generateToken(auth);

        // Then: Kiểm tra token khác null và validate trả về true
        assertNotNull(token);
        assertTrue(jwtProvider.validateToken(token));
        assertEquals("admin", jwtProvider.getUsername(token));
    }

    @Test
    void testTC5_ValidateTamperedToken_ReturnsFalse() {
        // Given
        Authentication auth = new UsernamePasswordAuthenticationToken("admin", "password", Collections.emptyList());
        String token = jwtProvider.generateToken(auth);

        // When: Sửa đổi 1 ký tự bất kỳ trong token (ví dụ thay ký tự cuối bằng chữ 'X')
        String tamperedToken = token.substring(0, token.length() - 1) + "X";

        // Then: Validate phải trả về false do chữ ký bị sai lệch
        assertFalse(jwtProvider.validateToken(tamperedToken));
    }
}