package com.todoapp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.todoapp.config.TestJpaConfig;
import com.todoapp.config.TestSecurityConfig;
import com.todoapp.entity.Todo;
import com.todoapp.entity.User;
import com.todoapp.service.TodoService;
import com.todoapp.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestSecurityConfig.class, TestJpaConfig.class})
@ActiveProfiles("test")
@WithMockUser
public class TodoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TodoService todoService;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private Todo testTodo;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");

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
    void whenGetAllTodos_thenReturnJsonArray() throws Exception {
        when(todoService.findAll()).thenReturn(Arrays.asList(testTodo));

        mockMvc.perform(get("/api/v1/todos"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].title").value("Test Todo"));
    }

    @Test
    void whenGetTodoById_thenReturnJson() throws Exception {
        when(todoService.findById(1L)).thenReturn(testTodo);

        mockMvc.perform(get("/api/v1/todos/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.title").value("Test Todo"));
    }

    @Test
    void whenCreateTodo_thenReturnJsonTodo() throws Exception {
        when(todoService.save(any(Todo.class))).thenReturn(testTodo);

        mockMvc.perform(post("/api/v1/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testTodo)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Todo"));
    }

    @Test
    void whenUpdateTodo_thenReturnJsonTodo() throws Exception {
        when(todoService.findById(1L)).thenReturn(testTodo);
        when(todoService.save(any(Todo.class))).thenReturn(testTodo);

        mockMvc.perform(put("/api/v1/todos/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testTodo)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Todo"));
    }

    @Test
    void whenDeleteTodo_thenReturn200() throws Exception {
        when(todoService.findById(1L)).thenReturn(testTodo);

        mockMvc.perform(delete("/api/v1/todos/1"))
                .andExpect(status().isOk());
    }

    @Test
    void whenGetTodosByUser_thenReturnJsonArray() throws Exception {
        when(userService.findById(1L)).thenReturn(testUser);
        when(todoService.findByUser(testUser)).thenReturn(Arrays.asList(testTodo));

        mockMvc.perform(get("/api/v1/todos/user/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].title").value("Test Todo"));
    }

    @Test
    void whenGetTodosByUserAndCompleted_thenReturnJsonArray() throws Exception {
        when(userService.findById(1L)).thenReturn(testUser);
        when(todoService.findByUserAndCompleted(testUser, true))
                .thenReturn(Arrays.asList(testTodo));

        mockMvc.perform(get("/api/v1/todos/user/1/completed/true"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].title").value("Test Todo"));
    }

    @Test
    void whenMarkAsCompleted_thenReturnJsonTodo() throws Exception {
        testTodo.setCompleted(true);
        when(todoService.markAsCompleted(1L)).thenReturn(testTodo);

        mockMvc.perform(put("/api/v1/todos/1/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    void whenSoftDelete_thenReturnJsonTodo() throws Exception {
        testTodo.setDeletedAt(Instant.now());
        when(todoService.softDelete(1L)).thenReturn(testTodo);

        mockMvc.perform(delete("/api/v1/todos/1/soft"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletedAt").isNotEmpty());
    }
} 