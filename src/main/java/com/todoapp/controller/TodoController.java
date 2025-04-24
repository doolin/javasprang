package com.todoapp.controller;

import com.todoapp.entity.Todo;
import com.todoapp.entity.User;
import com.todoapp.service.TodoService;
import com.todoapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/todos")
public class TodoController {
    private final TodoService todoService;
    private final UserService userService;

    @Autowired
    public TodoController(TodoService todoService, UserService userService) {
        this.todoService = todoService;
        this.userService = userService;
    }

    @GetMapping
    public List<Todo> getAllTodos() {
        return todoService.findAll();
    }

    @GetMapping("/{id}")
    public Todo getTodoById(@PathVariable Long id) {
        return todoService.findById(id);
    }

    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        return todoService.save(todo);
    }

    @PutMapping("/{id}")
    public Todo updateTodo(@PathVariable Long id, @RequestBody Todo todo) {
        todo.setId(id);
        return todoService.save(todo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTodo(@PathVariable Long id) {
        todoService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userId}")
    public List<Todo> getTodosByUser(@PathVariable Long userId) {
        User user = userService.findById(userId);
        return todoService.findByUser(user);
    }

    @GetMapping("/user/{userId}/completed/{completed}")
    public List<Todo> getTodosByUserAndCompleted(
            @PathVariable Long userId,
            @PathVariable boolean completed) {
        User user = userService.findById(userId);
        return todoService.findByUserAndCompleted(user, completed);
    }

    @PutMapping("/{id}/complete")
    public Todo markAsCompleted(@PathVariable Long id) {
        return todoService.markAsCompleted(id);
    }

    @DeleteMapping("/{id}/soft")
    public Todo softDelete(@PathVariable Long id) {
        return todoService.softDelete(id);
    }
} 