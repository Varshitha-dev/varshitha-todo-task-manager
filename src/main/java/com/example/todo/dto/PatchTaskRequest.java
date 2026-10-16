package com.example.todo.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record PatchTaskRequest(
        @Size(min = 1, max = 160, message = "Title must contain 1 to 160 characters.")
        String title,
        @Size(max = 4000, message = "Description must be 4000 characters or fewer.")
        String description,
        LocalDate deadline,
        @Pattern(regexp = "Pending|Completed", message = "Status must be Pending or Completed.")
        String status,
        @Pattern(regexp = "Low|Medium|High", message = "Priority must be Low, Medium, or High.")
        String priority
) {}
