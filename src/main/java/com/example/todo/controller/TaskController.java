package com.example.todo.controller;

import com.example.todo.dto.CreateTaskRequest;
import com.example.todo.dto.PatchTaskRequest;
import com.example.todo.dto.UpdateTaskRequest;
import com.example.todo.model.Task;
import com.example.todo.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    
    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public List<Task> list(
            @RequestParam(defaultValue = "All") String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "All") String priority,
            @RequestParam(defaultValue = "false") boolean overdue) {
        return service.list(status, search, priority, overdue);
    }

    @GetMapping("/{id}")
    public Task get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task create(@Valid @RequestBody CreateTaskRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public Task replace(@PathVariable long id, @Valid @RequestBody UpdateTaskRequest request) {
        return service.replace(id, request);
    }

    @PatchMapping("/{id}")
    public Task patch(@PathVariable long id, @Valid @RequestBody PatchTaskRequest request) {
        return service.patch(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
