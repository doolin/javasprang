package com.todoapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class FrontendController {
    
    @RequestMapping(value = {
        "/",
        "/login",
        "/register",
        "/todos"
    })
    public String serveAngularApp() {
        return "forward:index.html";
    }
} 