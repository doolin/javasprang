package com.todoapp.entity;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import com.todoapp.config.TestJpaConfig;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Import(TestJpaConfig.class)
class UserTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void whenCreateUser_thenUserIsCreated() {
        // given
        User user = new User();
        user.setUsername("testuser_user");
        user.setEmail("user_test@example.com");
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
        assertThat(foundUser.getUsername()).isEqualTo("testuser_user");
        assertThat(foundUser.getEmail()).isEqualTo("user_test@example.com");
        assertThat(foundUser.getRoles()).contains("ROLE_USER");
    }
} 