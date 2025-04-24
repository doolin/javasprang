package com.todoapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping(value = {"/api/v1/", "/api/v1/{*path}"})
    public String home() {
        return "forward:/index.html";
    }
} 