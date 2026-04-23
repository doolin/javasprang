package com.todoapp.util;

import com.todoapp.entity.User;
import com.todoapp.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.jsonwebtoken.ExpiredJwtException;

import java.lang.reflect.Field;
import java.util.Date;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private UserDetailsImpl userDetails;

    @BeforeEach
    void setUp() throws Exception {
        jwtUtil = new JwtUtil();

        Field secretField = JwtUtil.class.getDeclaredField("secret");
        secretField.setAccessible(true);
        secretField.set(jwtUtil, "test-secret-key-that-is-at-least-32-bytes-long-for-hmac");

        Field expirationField = JwtUtil.class.getDeclaredField("expiration");
        expirationField.setAccessible(true);
        expirationField.set(jwtUtil, 86400000L);

        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setEmail("alice@test.com");
        user.setPassword("encoded");
        user.setRoles(Set.of("ROLE_USER"));
        userDetails = new UserDetailsImpl(user);
    }

    @Test
    void generateAndExtractUsername() {
        String token = jwtUtil.generateToken(userDetails);
        assertEquals("alice", jwtUtil.extractUsername(token));
    }

    @Test
    void extractExpiration() {
        String token = jwtUtil.generateToken(userDetails);
        Date expiration = jwtUtil.extractExpiration(token);
        assertTrue(expiration.after(new Date()));
    }

    @Test
    void validateTokenValid() {
        String token = jwtUtil.generateToken(userDetails);
        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void validateTokenWrongUser() {
        String token = jwtUtil.generateToken(userDetails);

        User other = new User();
        other.setUsername("bob");
        other.setPassword("x");
        other.setRoles(Set.of("ROLE_USER"));

        assertFalse(jwtUtil.validateToken(token, new UserDetailsImpl(other)));
    }

    @Test
    void validateTokenExpired() throws Exception {
        Field expirationField = JwtUtil.class.getDeclaredField("expiration");
        expirationField.setAccessible(true);
        expirationField.set(jwtUtil, 0L);

        String token = jwtUtil.generateToken(userDetails);
        // Parsing an expired token throws before validateToken can return false
        assertThrows(ExpiredJwtException.class,
            () -> jwtUtil.validateToken(token, userDetails));
    }
}
