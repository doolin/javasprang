package com.todoapp.repository;

import com.todoapp.config.TestConfig;
import com.todoapp.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import(TestConfig.class)
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password123");
        testUser.setRoles(new HashSet<>());
        testUser.setCreatedAt(Instant.now());
        testUser.setUpdatedAt(Instant.now());
    }

    @Test
    void whenSaveUser_thenReturnSavedUser() {
        User savedUser = userRepository.save(testUser);
        assertNotNull(savedUser.getId());
        assertEquals(testUser.getUsername(), savedUser.getUsername());
        assertEquals(testUser.getEmail(), savedUser.getEmail());
    }

    @Test
    void whenFindByUsername_thenReturnUser() {
        userRepository.save(testUser);

        Optional<User> found = userRepository.findByUsername("testuser");
        assertTrue(found.isPresent());
        assertEquals(testUser.getUsername(), found.get().getUsername());
    }

    @Test
    void whenFindByEmail_thenReturnUser() {
        userRepository.save(testUser);

        Optional<User> found = userRepository.findByEmail("test@example.com");
        assertTrue(found.isPresent());
        assertEquals(testUser.getEmail(), found.get().getEmail());
    }

    @Test
    void whenFindByNonExistentUsername_thenReturnEmpty() {
        Optional<User> found = userRepository.findByUsername("nonexistent");
        assertFalse(found.isPresent());
    }

    @Test
    void whenFindByNonExistentEmail_thenReturnEmpty() {
        Optional<User> found = userRepository.findByEmail("nonexistent@example.com");
        assertFalse(found.isPresent());
    }

    @Test
    void whenUpdateUser_thenReturnUpdatedUser() {
        User savedUser = userRepository.save(testUser);
        savedUser.setEmail("updated@example.com");
        
        User updatedUser = userRepository.save(savedUser);
        assertEquals("updated@example.com", updatedUser.getEmail());
    }

    @Test
    void whenDeleteUser_thenUserNotFound() {
        User savedUser = userRepository.save(testUser);
        userRepository.deleteById(savedUser.getId());
        
        Optional<User> found = userRepository.findById(savedUser.getId());
        assertFalse(found.isPresent());
    }
} 