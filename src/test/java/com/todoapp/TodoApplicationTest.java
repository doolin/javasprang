package com.todoapp;

import com.todoapp.config.TestJpaConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestJpaConfig.class)
class TodoApplicationTest {

    @Test
    void contextLoads() {
        // Verifies the Spring context starts without errors.
        // TodoApplication.main() is 2 lines of Spring Boot
        // boilerplate that can't be unit tested without a port
        // conflict. contextLoads proves the app boots.
    }
}
