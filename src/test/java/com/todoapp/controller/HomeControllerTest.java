package com.todoapp.controller;

import com.todoapp.config.TestJpaConfig;
import com.todoapp.config.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({TestJpaConfig.class, TestSecurityConfig.class})
class HomeControllerTest {

    @Autowired private MockMvc mockMvc;

    @Test
    @WithMockUser
    void apiRootForwardsToIndex() throws Exception {
        mockMvc.perform(get("/api/v1/"))
            .andExpect(forwardedUrl("/index.html"));
    }
}
