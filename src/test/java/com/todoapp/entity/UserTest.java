package com.todoapp.entity;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void whenCreateUser_thenUserIsCreated() {
        // given
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password");
        Set<String> roles = new HashSet<>();
        roles.add("ROLE_USER");
        user.setRoles(roles);

        // when
        User savedUser = entityManager.persist(user);
        entityManager.flush();

        // then
        User foundUser = entityManager.find(User.class, savedUser.getId());
        assertThat(foundUser).isNotNull();
        assertThat(foundUser.getUsername()).isEqualTo("testuser");
        assertThat(foundUser.getEmail()).isEqualTo("test@example.com");
        assertThat(foundUser.getRoles()).contains("ROLE_USER");
    }
} 