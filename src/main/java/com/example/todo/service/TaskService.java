package com.example.todo.service;

import com.example.todo.dto.CreateTaskRequest;
import com.example.todo.dto.PatchTaskRequest;
import com.example.todo.dto.UpdateTaskRequest;
import com.example.todo.model.Task;
import com.example.todo.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {
    private final TaskRepository repository;

    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    public List<Task> list(String status, String search, String priority, boolean overdue) {
        return repository.findAll(status, search, priority, overdue);
    }

    public Task get(long id) {
        return repository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
    }

    public Task create(CreateTaskRequest request) {
        return repository.insert(request.title(), request.description(), request.deadline(),
                valueOr(request.status(), "Pending"), valueOr(request.priority(), "Medium"));
    }

    public Task replace(long id, UpdateTaskRequest request) {
        return repository.update(id, request.title(), request.description(), request.deadline(),
                request.status() == null ? "Pending" : request.status(),
                request.priority() == null ? "Medium" : request.priority())
                .orElseThrow(() -> new TaskNotFoundException(id));
    }

    public Task patch(long id, PatchTaskRequest request) {
        return repository.patch(id, request.title(), request.description(), request.deadline(),
                request.status(), request.priority()).orElseThrow(() -> new TaskNotFoundException(id));
    }

    public void delete(long id) {
        if (!repository.delete(id)) throw new TaskNotFoundException(id);
    }

    private String valueOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
