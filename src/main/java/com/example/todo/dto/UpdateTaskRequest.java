package com.example.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateTaskRequest(
        @NotBlank(message = "Title is required.")
        @Size(max = 160, message = "Title must be 160 characters or fewer.")
        String title,
        @Size(max = 4000, message = "Description must be 4000 characters or fewer.")
        String description,
        LocalDate deadline,
        @Pattern(regexp = "Pending|Completed", message = "Status must be Pending or Completed.")
        String status,
        @Pattern(regexp = "Low|Medium|High", message = "Priority must be Low, Medium, or High.")
        String priority
) {}
