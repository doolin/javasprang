package com.todoapp.security;

import com.todoapp.entity.User;
import com.todoapp.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserDetailsServiceImpl service;

    @Test
    void loadUserByUsernameFound() {
        User user = new User();
        user.setUsername("alice");
        user.setPassword("encoded");
        user.setRoles(Set.of("ROLE_USER"));

        when(userService.findByUsername("alice")).thenReturn(Optional.of(user));

        var details = service.loadUserByUsername("alice");
        assertEquals("alice", details.getUsername());
    }

    @Test
    void loadUserByUsernameNotFound() {
        when(userService.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
            () -> service.loadUserByUsername("nobody"));
    }
}
