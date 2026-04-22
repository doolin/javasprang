package com.todoapp.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RegisterRequestTest {

    @Test
    void gettersAndSetters() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setEmail("a@b.com");
        req.setPassword("secret");

        assertEquals("alice", req.getUsername());
        assertEquals("a@b.com", req.getEmail());
        assertEquals("secret", req.getPassword());
    }
}
