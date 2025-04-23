package com.todoapp.service;

import com.todoapp.entity.Todo;
import com.todoapp.entity.User;
import com.todoapp.repository.TodoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TodoServiceTest {

    @Mock
    private TodoRepository todoRepository;

    @InjectMocks
    private TodoService todoService;

    private User testUser;
    private Todo testTodo;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password");

        testTodo = new Todo();
        testTodo.setId(1L);
        testTodo.setTitle("Test Todo");
        testTodo.setDescription("Test Description");
        testTodo.setCompleted(false);
        testTodo.setUser(testUser);
        testTodo.setCreatedAt(Instant.now());
        testTodo.setUpdatedAt(Instant.now());
    }

    @Test
    void whenFindAll_thenReturnTodoList() {
        when(todoRepository.findAll()).thenReturn(Arrays.asList(testTodo));

        List<Todo> found = todoService.findAll();

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getTitle()).isEqualTo(testTodo.getTitle());
        verify(todoRepository).findAll();
    }

    @Test
    void whenFindById_thenReturnTodo() {
        when(todoRepository.findById(1L)).thenReturn(Optional.of(testTodo));

        Todo found = todoService.findById(1L);

        assertThat(found.getTitle()).isEqualTo(testTodo.getTitle());
        verify(todoRepository).findById(1L);
    }

    @Test
    void whenFindByInvalidId_thenThrowException() {
        when(todoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> todoService.findById(99L));
        verify(todoRepository).findById(99L);
    }

    @Test
    void whenSave_thenReturnSavedTodo() {
        when(todoRepository.save(any(Todo.class))).thenReturn(testTodo);

        Todo saved = todoService.save(testTodo);

        assertThat(saved.getTitle()).isEqualTo(testTodo.getTitle());
        verify(todoRepository).save(testTodo);
    }

    @Test
    void whenDeleteById_thenRepositoryMethodCalled() {
        doNothing().when(todoRepository).deleteById(1L);

        todoService.deleteById(1L);

        verify(todoRepository).deleteById(1L);
    }

    @Test
    void whenFindByUser_thenReturnUserTodos() {
        when(todoRepository.findByUserAndDeletedAtIsNull(testUser))
            .thenReturn(Arrays.asList(testTodo));

        List<Todo> found = todoService.findByUser(testUser);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getTitle()).isEqualTo(testTodo.getTitle());
        verify(todoRepository).findByUserAndDeletedAtIsNull(testUser);
    }

    @Test
    void whenFindByUserAndCompleted_thenReturnFilteredTodos() {
        when(todoRepository.findByUserAndCompletedAndDeletedAtIsNull(testUser, true))
            .thenReturn(Arrays.asList(testTodo));

        List<Todo> found = todoService.findByUserAndCompleted(testUser, true);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getTitle()).isEqualTo(testTodo.getTitle());
        verify(todoRepository).findByUserAndCompletedAndDeletedAtIsNull(testUser, true);
    }

    @Test
    void whenMarkAsCompleted_thenReturnCompletedTodo() {
        Todo completedTodo = new Todo();
        completedTodo.setId(1L);
        completedTodo.setCompleted(true);

        when(todoRepository.findById(1L)).thenReturn(Optional.of(testTodo));
        when(todoRepository.save(any(Todo.class))).thenReturn(completedTodo);

        Todo result = todoService.markAsCompleted(1L);

        assertThat(result.isCompleted()).isTrue();
        verify(todoRepository).findById(1L);
        verify(todoRepository).save(any(Todo.class));
    }

    @Test
    void whenSoftDelete_thenReturnDeletedTodo() {
        Todo deletedTodo = new Todo();
        deletedTodo.setId(1L);
        deletedTodo.setDeletedAt(Instant.now());

        when(todoRepository.findById(1L)).thenReturn(Optional.of(testTodo));
        when(todoRepository.save(any(Todo.class))).thenReturn(deletedTodo);

        Todo result = todoService.softDelete(1L);

        assertThat(result.getDeletedAt()).isNotNull();
        verify(todoRepository).findById(1L);
        verify(todoRepository).save(any(Todo.class));
    }
} 