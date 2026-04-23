package com.todoapp.entity;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class UserBranchTest {

    private User makeUser(Long id, String username, String email) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword("encoded");
        u.setRoles(Set.of("ROLE_USER"));
        return u;
    }

    @Test
    void gettersAndSetters() {
        User u = new User();
        u.setId(1L);
        u.setUsername("alice");
        u.setEmail("a@b.com");
        u.setPassword("pass");
        u.setRoles(Set.of("ROLE_ADMIN"));

        assertEquals(1L, u.getId());
        assertEquals("alice", u.getUsername());
        assertEquals("a@b.com", u.getEmail());
        assertEquals("pass", u.getPassword());
        assertTrue(u.getRoles().contains("ROLE_ADMIN"));
    }

    @Test
    void equalsSameObject() {
        User u = makeUser(1L, "alice", "a@b.com");
        assertEquals(u, u);
    }

    @Test
    void equalsNull() {
        assertNotEquals(null, makeUser(1L, "alice", "a@b.com"));
    }

    @Test
    void equalsDifferentType() {
        assertNotEquals("string", makeUser(1L, "alice", "a@b.com"));
    }

    @Test
    void equalsMatchingFields() {
        User a = makeUser(1L, "alice", "a@b.com");
        User b = makeUser(1L, "alice", "a@b.com");
        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void equalsDifferentId() {
        User a = makeUser(1L, "alice", "a@b.com");
        User b = makeUser(2L, "alice", "a@b.com");
        assertNotEquals(a, b);
    }

    @Test
    void equalsDifferentUsername() {
        User a = makeUser(1L, "alice", "a@b.com");
        User b = makeUser(1L, "bob", "a@b.com");
        assertNotEquals(a, b);
    }

    @Test
    void equalsDifferentEmail() {
        User a = makeUser(1L, "alice", "a@b.com");
        User b = makeUser(1L, "alice", "b@b.com");
        assertNotEquals(a, b);
    }

    @Test
    void equalsWithNullFields() {
        User a = new User();
        User b = new User();
        assertEquals(a, b);
    }

    @Test
    void equalsSuperDiffers() {
        User a = makeUser(1L, "alice", "a@b.com");
        a.setCreatedAt(java.time.Instant.now());
        User b = makeUser(1L, "alice", "a@b.com");
        b.setCreatedAt(java.time.Instant.now().plusSeconds(1));
        assertNotEquals(a, b);
    }

    @Test
    void equalsOneNullId() {
        User a = makeUser(null, "alice", "a@b.com");
        User b = makeUser(1L, "alice", "a@b.com");
        assertNotEquals(a, b);
    }

    @Test
    void equalsOneNullUsername() {
        User a = makeUser(1L, null, "a@b.com");
        User b = makeUser(1L, "alice", "a@b.com");
        assertNotEquals(a, b);
    }

    @Test
    void toStringContainsFields() {
        User u = makeUser(1L, "alice", "a@b.com");
        String s = u.toString();
        assertTrue(s.contains("User"));
        assertTrue(s.contains("alice"));
        assertTrue(s.contains("a@b.com"));
    }
}
