package com.todoapp.security;

import com.todoapp.entity.User;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class UserDetailsImplTest {

    private User makeUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setEmail("alice@test.com");
        user.setPassword("encoded");
        user.setRoles(Set.of("ROLE_USER", "ROLE_ADMIN"));
        return user;
    }

    @Test
    void delegatesToUser() {
        User user = makeUser();
        UserDetailsImpl details = new UserDetailsImpl(user);

        assertEquals("alice", details.getUsername());
        assertEquals("encoded", details.getPassword());
        assertSame(user, details.getUser());
    }

    @Test
    void authoritiesMappedFromRoles() {
        UserDetailsImpl details = new UserDetailsImpl(makeUser());

        assertEquals(2, details.getAuthorities().size());
        assertTrue(details.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
        assertTrue(details.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void accountFlagsAllTrue() {
        UserDetailsImpl details = new UserDetailsImpl(makeUser());

        assertTrue(details.isAccountNonExpired());
        assertTrue(details.isAccountNonLocked());
        assertTrue(details.isCredentialsNonExpired());
    }

    @Test
    void enabledWhenNotDeleted() {
        UserDetailsImpl details = new UserDetailsImpl(makeUser());
        assertTrue(details.isEnabled());
    }

    @Test
    void disabledWhenDeleted() {
        User user = makeUser();
        user.setDeletedAt(Instant.now());
        UserDetailsImpl details = new UserDetailsImpl(user);
        assertFalse(details.isEnabled());
    }
}
