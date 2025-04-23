package com.todoapp.entity;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TodoTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void whenCreateTodo_thenTodoIsCreated() {
        // given
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password");
        Set<String> roles = new HashSet<>();
        roles.add("ROLE_USER");
        user.setRoles(roles);
        User savedUser = entityManager.persist(user);

        Todo todo = new Todo();
        todo.setTitle("Test Todo");
        todo.setDescription("Test Description");
        todo.setCompleted(false);
        todo.setUser(savedUser);

        // when
        Todo savedTodo = entityManager.persist(todo);
        entityManager.flush();

        // then
        Todo foundTodo = entityManager.find(Todo.class, savedTodo.getId());
        assertThat(foundTodo).isNotNull();
        assertThat(foundTodo.getTitle()).isEqualTo("Test Todo");
        assertThat(foundTodo.getDescription()).isEqualTo("Test Description");
        assertThat(foundTodo.isCompleted()).isFalse();
        assertThat(foundTodo.getUser().getId()).isEqualTo(savedUser.getId());
    }
} 