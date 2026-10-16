package com.example.todo.service;

public class TaskNotFoundException extends RuntimeException {
    public TaskNotFoundException(long id) {
        super("Task with id " + id + " was not found.");
    }
}
