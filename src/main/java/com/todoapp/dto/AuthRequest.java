package com.todoapp.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class AuthRequest {
    @NotBlank(message = "Username is required")
    private String username;

    // Max 72 enforces BCryptPasswordEncoder.matches() input bounds. Mirrors
    // the constraint on RegisterRequest.password; without it the login path
    // would still accept >72-char inputs that the BCrypt matcher
    // incorrectly accepts (CVE-2025-22228, SB-GL-50).
    @NotBlank(message = "Password is required")
    @Size(max = 72, message = "Password cannot exceed 72 characters")
    private String password;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
