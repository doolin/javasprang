package com.todoapp.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TodoBranchTest {

    private Todo makeTodo(Long id, String title, TodoStatus status, boolean completed) {
        Todo t = new Todo();
        t.setId(id);
        t.setTitle(title);
        t.setStatus(status);
        t.setCompleted(completed);
        return t;
    }

    @Test
    void gettersAndSetters() {
        Todo t = new Todo();
        User u = new User();
        t.setId(1L);
        t.setTitle("title");
        t.setDescription("desc");
        t.setStatus(TodoStatus.IN_PROGRESS);
        t.setCompleted(true);
        t.setUser(u);

        assertEquals(1L, t.getId());
        assertEquals("title", t.getTitle());
        assertEquals("desc", t.getDescription());
        assertEquals(TodoStatus.IN_PROGRESS, t.getStatus());
        assertTrue(t.isCompleted());
        assertSame(u, t.getUser());
    }

    @Test
    void equalsSameObject() {
        Todo t = makeTodo(1L, "a", TodoStatus.TODO, false);
        assertEquals(t, t);
    }

    @Test
    void equalsNull() {
        assertNotEquals(null, makeTodo(1L, "a", TodoStatus.TODO, false));
    }

    @Test
    void equalsDifferentType() {
        assertNotEquals("string", makeTodo(1L, "a", TodoStatus.TODO, false));
    }

    @Test
    void equalsMatchingFields() {
        Todo a = makeTodo(1L, "a", TodoStatus.TODO, false);
        Todo b = makeTodo(1L, "a", TodoStatus.TODO, false);
        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void equalsDifferentId() {
        Todo a = makeTodo(1L, "a", TodoStatus.TODO, false);
        Todo b = makeTodo(2L, "a", TodoStatus.TODO, false);
        assertNotEquals(a, b);
    }

    @Test
    void equalsDifferentTitle() {
        Todo a = makeTodo(1L, "a", TodoStatus.TODO, false);
        Todo b = makeTodo(1L, "b", TodoStatus.TODO, false);
        assertNotEquals(a, b);
    }

    @Test
    void equalsDifferentStatus() {
        Todo a = makeTodo(1L, "a", TodoStatus.TODO, false);
        Todo b = makeTodo(1L, "a", TodoStatus.DONE, false);
        assertNotEquals(a, b);
    }

    @Test
    void equalsDifferentCompleted() {
        Todo a = makeTodo(1L, "a", TodoStatus.TODO, false);
        Todo b = makeTodo(1L, "a", TodoStatus.TODO, true);
        assertNotEquals(a, b);
    }

    @Test
    void equalsDifferentDescription() {
        Todo a = makeTodo(1L, "a", TodoStatus.TODO, false);
        a.setDescription("x");
        Todo b = makeTodo(1L, "a", TodoStatus.TODO, false);
        b.setDescription("y");
        assertNotEquals(a, b);
    }

    @Test
    void equalsWithNullFields() {
        Todo a = new Todo();
        Todo b = new Todo();
        assertEquals(a, b);
    }

    @Test
    void equalsSuperDiffers() {
        // Same Todo fields but different BaseEntity fields
        Todo a = makeTodo(1L, "a", TodoStatus.TODO, false);
        a.setCreatedAt(java.time.Instant.now());
        Todo b = makeTodo(1L, "a", TodoStatus.TODO, false);
        b.setCreatedAt(java.time.Instant.now().plusSeconds(1));
        assertNotEquals(a, b);
    }

    @Test
    void equalsOneNullId() {
        Todo a = makeTodo(null, "a", TodoStatus.TODO, false);
        Todo b = makeTodo(1L, "a", TodoStatus.TODO, false);
        assertNotEquals(a, b);
    }

    @Test
    void equalsOneNullTitle() {
        Todo a = makeTodo(1L, null, TodoStatus.TODO, false);
        Todo b = makeTodo(1L, "a", TodoStatus.TODO, false);
        assertNotEquals(a, b);
    }

    @Test
    void toStringContainsFields() {
        Todo t = makeTodo(1L, "test", TodoStatus.TODO, false);
        String s = t.toString();
        assertTrue(s.contains("Todo"));
        assertTrue(s.contains("test"));
        assertTrue(s.contains("TODO"));
    }
}
