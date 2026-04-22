package com.todoapp.entity;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.Objects;

@Entity
@Table(name = "todos")
public class Todo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String title;

    @Size(max = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column
    private TodoStatus status = TodoStatus.TODO;

    private boolean completed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TodoStatus getStatus() { return status; }
    public void setStatus(TodoStatus status) { this.status = status; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        Todo todo = (Todo) o;
        return completed == todo.completed
            && Objects.equals(id, todo.id)
            && Objects.equals(title, todo.title)
            && Objects.equals(description, todo.description)
            && status == todo.status;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), id, title, description, status, completed);
    }

    @Override
    public String toString() {
        return "Todo(id=" + id
            + ", title=" + title
            + ", status=" + status
            + ", completed=" + completed + ")";
    }
}
