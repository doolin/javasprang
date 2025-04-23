package com.todoapp.repository;

import com.todoapp.entity.Todo;
import com.todoapp.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TodoRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TodoRepository todoRepository;

    @Test
    void whenFindByUser_thenReturnTodos() {
        // given
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password");
        Set<String> roles = new HashSet<>();
        roles.add("ROLE_USER");
        user.setRoles(roles);
        User savedUser = entityManager.persist(user);

        Todo todo1 = new Todo();
        todo1.setTitle("Todo 1");
        todo1.setDescription("Description 1");
        todo1.setCompleted(false);
        todo1.setUser(savedUser);
        entityManager.persist(todo1);

        Todo todo2 = new Todo();
        todo2.setTitle("Todo 2");
        todo2.setDescription("Description 2");
        todo2.setCompleted(true);
        todo2.setUser(savedUser);
        entityManager.persist(todo2);

        entityManager.flush();

        // when
        List<Todo> foundTodos = todoRepository.findByUserAndDeletedAtIsNull(savedUser);

        // then
        assertThat(foundTodos).hasSize(2);
        assertThat(foundTodos).extracting(Todo::getTitle)
            .containsExactlyInAnyOrder("Todo 1", "Todo 2");
    }

    @Test
    void whenFindByUserAndCompleted_thenReturnCompletedTodos() {
        // given
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password");
        Set<String> roles = new HashSet<>();
        roles.add("ROLE_USER");
        user.setRoles(roles);
        User savedUser = entityManager.persist(user);

        Todo todo1 = new Todo();
        todo1.setTitle("Todo 1");
        todo1.setDescription("Description 1");
        todo1.setCompleted(false);
        todo1.setUser(savedUser);
        entityManager.persist(todo1);

        Todo todo2 = new Todo();
        todo2.setTitle("Todo 2");
        todo2.setDescription("Description 2");
        todo2.setCompleted(true);
        todo2.setUser(savedUser);
        entityManager.persist(todo2);

        entityManager.flush();

        // when
        List<Todo> completedTodos = todoRepository.findByUserAndCompletedAndDeletedAtIsNull(savedUser, true);

        // then
        assertThat(completedTodos).hasSize(1);
        assertThat(completedTodos.get(0).getTitle()).isEqualTo("Todo 2");
    }
} 