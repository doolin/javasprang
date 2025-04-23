package com.todoapp.repository;

import com.todoapp.entity.Todo;
import com.todoapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {
    List<Todo> findByUserAndDeletedAtIsNull(User user);
    List<Todo> findByUserAndCompletedAndDeletedAtIsNull(User user, boolean completed);
} 