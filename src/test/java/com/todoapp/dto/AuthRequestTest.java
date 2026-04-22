package com.todoapp.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AuthRequestTest {

    @Test
    void gettersAndSetters() {
        AuthRequest req = new AuthRequest();
        req.setUsername("alice");
        req.setPassword("secret");

        assertEquals("alice", req.getUsername());
        assertEquals("secret", req.getPassword());
    }
}
