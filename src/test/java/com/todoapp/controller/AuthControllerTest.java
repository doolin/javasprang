package com.todoapp.controller;

import com.todoapp.config.TestJpaConfig;
import com.todoapp.config.TestSecurityConfig;
import com.todoapp.dto.AuthResponse;
import com.todoapp.service.AuthService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({TestJpaConfig.class, TestSecurityConfig.class})
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private AuthService authService;

    @Test
    @WithMockUser
    void login() throws Exception {
        when(authService.login(any())).thenReturn(new AuthResponse("tok", "alice", "a@b.com"));

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"alice\",\"password\":\"pass\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("tok"));
    }

    @Test
    @WithMockUser
    void register() throws Exception {
        when(authService.register(any())).thenReturn(new AuthResponse("tok", "bob", "b@b.com"));

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"bob\",\"email\":\"b@b.com\",\"password\":\"secret\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("bob"));
    }

    // 73-character password — one past the BCryptPasswordEncoder 72-byte
    // input limit. The DTO @Size(max = 72) cap is the compensating control
    // for CVE-2025-22228 (SB-GL-50); both register and login must reject
    // longer inputs before they reach BCryptPasswordEncoder.matches().
    private static final String PASSWORD_73 = "a".repeat(73);

    @Test
    @WithMockUser
    void registerRejectsPasswordOverSeventyTwoChars() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"bob\",\"email\":\"b@b.com\",\"password\":\"" + PASSWORD_73 + "\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void loginRejectsPasswordOverSeventyTwoChars() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"alice\",\"password\":\"" + PASSWORD_73 + "\"}"))
            .andExpect(status().isBadRequest());
    }
}
