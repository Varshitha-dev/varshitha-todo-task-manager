package com.example.todo.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class DatabaseInitializer {
    @Bean
    ApplicationRunner createDatabaseDirectory() {
        return args -> Files.createDirectories(Path.of("data"));
    }
}
