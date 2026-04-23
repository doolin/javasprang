package com.todoapp.service;

import com.todoapp.dto.AuthRequest;
import com.todoapp.dto.AuthResponse;
import com.todoapp.dto.RegisterRequest;
import com.todoapp.entity.User;
import com.todoapp.exception.InvalidCredentialsException;
import com.todoapp.exception.ResourceConflictException;
import com.todoapp.security.UserDetailsImpl;
import com.todoapp.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserService userService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks private AuthService authService;

    @Test
    void loginSuccess() {
        AuthRequest req = new AuthRequest();
        req.setUsername("alice");
        req.setPassword("pass");

        User user = new User();
        user.setUsername("alice");
        user.setEmail("a@b.com");
        user.setPassword("encoded");
        user.setRoles(Set.of("ROLE_USER"));

        UserDetailsImpl details = new UserDetailsImpl(user);
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(details);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(auth);
        when(jwtUtil.generateToken(details)).thenReturn("jwt-token");

        AuthResponse resp = authService.login(req);

        assertEquals("jwt-token", resp.getToken());
        assertEquals("alice", resp.getUsername());
        assertEquals("a@b.com", resp.getEmail());
    }

    @Test
    void loginFailure() {
        AuthRequest req = new AuthRequest();
        req.setUsername("alice");
        req.setPassword("wrong");

        when(authenticationManager.authenticate(any()))
            .thenThrow(new BadCredentialsException("bad"));

        assertThrows(InvalidCredentialsException.class, () -> authService.login(req));
    }

    @Test
    void registerSuccess() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("bob");
        req.setEmail("bob@b.com");
        req.setPassword("secret");

        when(userService.findByUsername("bob")).thenReturn(Optional.empty());
        when(userService.findByEmail("bob@b.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("encoded");

        User saved = new User();
        saved.setId(1L);
        saved.setUsername("bob");
        saved.setEmail("bob@b.com");
        saved.setPassword("encoded");
        saved.setRoles(Set.of("ROLE_USER"));
        when(userService.save(any(User.class))).thenReturn(saved);
        when(jwtUtil.generateToken(any(UserDetailsImpl.class))).thenReturn("new-jwt");

        AuthResponse resp = authService.register(req);

        assertEquals("new-jwt", resp.getToken());
        assertEquals("bob", resp.getUsername());
    }

    @Test
    void registerDuplicateUsername() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setEmail("new@b.com");

        when(userService.findByUsername("alice")).thenReturn(Optional.of(new User()));

        assertThrows(ResourceConflictException.class, () -> authService.register(req));
    }

    @Test
    void registerDuplicateEmail() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("newuser");
        req.setEmail("existing@b.com");

        when(userService.findByUsername("newuser")).thenReturn(Optional.empty());
        when(userService.findByEmail("existing@b.com")).thenReturn(Optional.of(new User()));

        assertThrows(ResourceConflictException.class, () -> authService.register(req));
    }
}
