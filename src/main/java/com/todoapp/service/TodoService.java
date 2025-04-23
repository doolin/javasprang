package com.todoapp.service;

import com.todoapp.entity.Todo;
import com.todoapp.entity.User;
import com.todoapp.repository.TodoRepository;
import com.todoapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TodoService {
    private final TodoRepository todoRepository;
    private final UserRepository userRepository;

    @Autowired
    public TodoService(TodoRepository todoRepository, UserRepository userRepository) {
        this.todoRepository = todoRepository;
        this.userRepository = userRepository;
    }

    public List<Todo> findAll() {
        return todoRepository.findAll();
    }

    public Todo findById(Long id) {
        return todoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found with id: " + id));
    }

    public Todo save(Todo todo) {
        return todoRepository.save(todo);
    }

    public void deleteById(Long id) {
        todoRepository.deleteById(id);
    }

    public List<Todo> findByUser(User user) {
        return todoRepository.findByUserAndDeletedAtIsNull(user);
    }

    public List<Todo> findByUserAndCompleted(User user, boolean completed) {
        return todoRepository.findByUserAndCompletedAndDeletedAtIsNull(user, completed);
    }

    public List<Todo> findByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return findByUser(user);
    }

    public List<Todo> findByUserIdAndCompleted(Long userId, boolean completed) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return findByUserAndCompleted(user, completed);
    }

    public Todo markAsCompleted(Long id) {
        Todo todo = findById(id);
        todo.setCompleted(true);
        return todoRepository.save(todo);
    }

    public Todo softDelete(Long id) {
        Todo todo = findById(id);
        todo.setDeletedAt(Instant.now());
        return todoRepository.save(todo);
    }
} 