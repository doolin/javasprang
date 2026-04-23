package com.todoapp.entity;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class BaseEntityTest {

    // Concrete subclass for testing the abstract BaseEntity
    static class TestEntity extends BaseEntity {}

    @Test
    void gettersAndSetters() {
        TestEntity e = new TestEntity();
        Instant now = Instant.now();

        e.setCreatedAt(now);
        e.setUpdatedAt(now);
        e.setDeletedAt(now);

        assertEquals(now, e.getCreatedAt());
        assertEquals(now, e.getUpdatedAt());
        assertEquals(now, e.getDeletedAt());
    }

    @Test
    void equalsSameObject() {
        TestEntity e = new TestEntity();
        assertEquals(e, e);
    }

    @Test
    void equalsNull() {
        TestEntity e = new TestEntity();
        assertNotEquals(null, e);
    }

    @Test
    void equalsDifferentType() {
        TestEntity e = new TestEntity();
        assertNotEquals("string", e);
    }

    @Test
    void equalsMatchingFields() {
        Instant now = Instant.now();
        TestEntity a = new TestEntity();
        a.setCreatedAt(now);
        a.setUpdatedAt(now);

        TestEntity b = new TestEntity();
        b.setCreatedAt(now);
        b.setUpdatedAt(now);

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void equalsDifferentFields() {
        TestEntity a = new TestEntity();
        a.setCreatedAt(Instant.now());

        TestEntity b = new TestEntity();
        b.setCreatedAt(Instant.now().plusSeconds(1));

        assertNotEquals(a, b);
    }

    @Test
    void equalsWithNullFields() {
        TestEntity a = new TestEntity();
        TestEntity b = new TestEntity();
        assertEquals(a, b);
    }

    @Test
    void equalsOneNullCreatedAt() {
        TestEntity a = new TestEntity();
        a.setCreatedAt(Instant.now());
        TestEntity b = new TestEntity();
        assertNotEquals(a, b);
    }

    @Test
    void equalsOneNullUpdatedAt() {
        Instant now = Instant.now();
        TestEntity a = new TestEntity();
        a.setCreatedAt(now);
        a.setUpdatedAt(now);
        TestEntity b = new TestEntity();
        b.setCreatedAt(now);
        assertNotEquals(a, b);
    }

    @Test
    void equalsOneNullDeletedAt() {
        Instant now = Instant.now();
        TestEntity a = new TestEntity();
        a.setCreatedAt(now);
        a.setUpdatedAt(now);
        a.setDeletedAt(now);
        TestEntity b = new TestEntity();
        b.setCreatedAt(now);
        b.setUpdatedAt(now);
        assertNotEquals(a, b);
    }

    @Test
    void toStringContainsClassName() {
        TestEntity e = new TestEntity();
        assertTrue(e.toString().contains("TestEntity"));
    }
}
