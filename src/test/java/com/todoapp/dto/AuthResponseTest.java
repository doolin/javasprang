package com.todoapp.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AuthResponseTest {

    @Test
    void noArgConstructor() {
        AuthResponse resp = new AuthResponse();
        assertNull(resp.getToken());
        assertNull(resp.getUsername());
        assertNull(resp.getEmail());
    }

    @Test
    void allArgConstructor() {
        AuthResponse resp = new AuthResponse("tok", "alice", "a@b.com");
        assertEquals("tok", resp.getToken());
        assertEquals("alice", resp.getUsername());
        assertEquals("a@b.com", resp.getEmail());
    }

    @Test
    void setters() {
        AuthResponse resp = new AuthResponse();
        resp.setToken("t");
        resp.setUsername("u");
        resp.setEmail("e");

        assertEquals("t", resp.getToken());
        assertEquals("u", resp.getUsername());
        assertEquals("e", resp.getEmail());
    }
}
