package com.todoapp.service;

import com.todoapp.entity.User;
import com.todoapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password123");
        testUser.setRoles(new HashSet<>(Arrays.asList("ROLE_USER")));
        testUser.setCreatedAt(Instant.now());
        testUser.setUpdatedAt(Instant.now());
    }

    @Test
    void whenFindAll_thenReturnUserList() {
        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser));

        var users = userService.findAll();
        assertNotNull(users);
        assertEquals(1, users.size());
        assertEquals(testUser.getUsername(), users.get(0).getUsername());
    }

    @Test
    void whenFindById_thenReturnUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        var user = userService.findById(1L);
        assertNotNull(user);
        assertEquals(testUser.getUsername(), user.getUsername());
    }

    @Test
    void whenFindByInvalidId_thenThrowException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.findById(99L));
        verify(userRepository).findById(99L);
    }

    @Test
    void whenSave_thenReturnSavedUser() {
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        var savedUser = userService.save(testUser);
        assertNotNull(savedUser);
        assertEquals(testUser.getUsername(), savedUser.getUsername());
    }

    @Test
    void whenDeleteById_thenVerifyRepositoryCall() {
        doNothing().when(userRepository).deleteById(1L);

        userService.deleteById(1L);
        verify(userRepository, times(1)).deleteById(1L);
    }

    @Test
    void whenSoftDelete_thenReturnUpdatedUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        var softDeletedUser = userService.softDelete(1L);
        assertNotNull(softDeletedUser);
        assertNotNull(softDeletedUser.getDeletedAt());
    }

    @Test
    void whenFindByUsername_thenReturnUser() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        var user = userService.findByUsername("testuser");
        assertTrue(user.isPresent());
        assertEquals(testUser.getUsername(), user.get().getUsername());
    }

    @Test
    void whenFindByEmail_thenReturnUser() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        var user = userService.findByEmail("test@example.com");
        assertTrue(user.isPresent());
        assertEquals(testUser.getEmail(), user.get().getEmail());
    }
} 