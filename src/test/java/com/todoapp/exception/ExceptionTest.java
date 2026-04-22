package com.todoapp.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class ExceptionTest {

    @Test
    void invalidCredentialsException() {
        InvalidCredentialsException ex = new InvalidCredentialsException("bad creds");
        assertEquals("bad creds", ex.getMessage());
    }

    @Test
    void resourceConflictException() {
        ResourceConflictException ex = new ResourceConflictException("duplicate");
        assertEquals("duplicate", ex.getMessage());
    }

    @Test
    void authErrorResponse() {
        AuthErrorResponse resp = new AuthErrorResponse("oops");
        assertEquals("oops", resp.getMessage());

        resp.setMessage("fixed");
        assertEquals("fixed", resp.getMessage());
    }

    @Test
    void handlerInvalidCredentials() {
        AuthExceptionHandler handler = new AuthExceptionHandler();
        InvalidCredentialsException ex = new InvalidCredentialsException("wrong password");

        ResponseEntity<AuthErrorResponse> response = handler.handleInvalidCredentials(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("wrong password", response.getBody().getMessage());
    }

    @Test
    void handlerResourceConflict() {
        AuthExceptionHandler handler = new AuthExceptionHandler();
        ResourceConflictException ex = new ResourceConflictException("already exists");

        ResponseEntity<AuthErrorResponse> response = handler.handleResourceConflict(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("already exists", response.getBody().getMessage());
    }
}
