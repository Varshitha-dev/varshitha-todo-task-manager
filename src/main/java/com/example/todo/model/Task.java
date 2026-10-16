package com.example.todo.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record Task(
        long id,
        String title,
        String description,
        LocalDate deadline,
        String status,
        String priority,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean overdue
) {}
