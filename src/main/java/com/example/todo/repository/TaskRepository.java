package com.example.todo.repository;

import com.example.todo.model.Task;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class TaskRepository {
    private final JdbcTemplate jdbc;

    public TaskRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Task> mapper = (rs, rowNum) -> mapTask(rs);

    private Task mapTask(ResultSet rs) throws SQLException {
        String deadlineValue = rs.getString("deadline");
        LocalDate deadline = deadlineValue == null ? null : LocalDate.parse(deadlineValue);
        LocalDate today = LocalDate.now();
        String status = rs.getString("status");
        return new Task(
                rs.getLong("id"),
                rs.getString("title"),
                rs.getString("description"),
                deadline,
                status,
                rs.getString("priority"),
                LocalDateTime.parse(rs.getString("created_at")),
                LocalDateTime.parse(rs.getString("updated_at")),
                deadline != null && deadline.isBefore(today) && !"Completed".equals(status)
        );
    }

    public List<Task> findAll(String status, String search, String priority, boolean overdueOnly) {
        StringBuilder sql = new StringBuilder("SELECT * FROM tasks WHERE 1=1");
        java.util.List<Object> args = new java.util.ArrayList<>();
        if (status != null && !status.isBlank() && !"All".equalsIgnoreCase(status)) {
            sql.append(" AND status = ?");
            args.add(status);
        }
        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(title) LIKE ? OR LOWER(COALESCE(description,'')) LIKE ?)");
            String term = "%" + search.toLowerCase() + "%";
            args.add(term);
            args.add(term);
        }
        if (priority != null && !priority.isBlank() && !"All".equalsIgnoreCase(priority)) {
            sql.append(" AND priority = ?");
            args.add(priority);
        }
        if (overdueOnly) {
            sql.append(" AND deadline IS NOT NULL AND deadline < ? AND status <> 'Completed'");
            args.add(LocalDate.now().toString());
        }
        sql.append(" ORDER BY CASE status WHEN 'Pending' THEN 0 ELSE 1 END, deadline IS NULL, deadline ASC, id DESC");
        return jdbc.query(sql.toString(), mapper, args.toArray());
    }

    public Optional<Task> findById(long id) {
        List<Task> results = jdbc.query("SELECT * FROM tasks WHERE id = ?", mapper, id);
        return results.stream().findFirst();
    }

    public Task insert(String title, String description, LocalDate deadline, String status, String priority) {
        String now = LocalDateTime.now().withNano(0).toString();
        jdbc.update("INSERT INTO tasks(title, description, deadline, status, priority, created_at, updated_at) VALUES(?,?,?,?,?,?,?)",
                title.trim(), blankToNull(description), deadline == null ? null : deadline.toString(),
                status, priority, now, now);
        Long id = jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
        return findById(id).orElseThrow();
    }

    public Optional<Task> update(long id, String title, String description, LocalDate deadline, String status, String priority) {
        String now = LocalDateTime.now().withNano(0).toString();
        int changed = jdbc.update("UPDATE tasks SET title=?, description=?, deadline=?, status=?, priority=?, updated_at=? WHERE id=?",
                title.trim(), blankToNull(description), deadline == null ? null : deadline.toString(),
                status, priority, now, id);
        return changed == 0 ? Optional.empty() : findById(id);
    }

    public Optional<Task> patch(long id, String title, String description, LocalDate deadline, String status, String priority) {
        Optional<Task> existing = findById(id);
        if (existing.isEmpty()) return Optional.empty();
        Task old = existing.get();
        return update(id,
                title == null ? old.title() : title,
                description == null ? old.description() : description,
                deadline == null ? old.deadline() : deadline,
                status == null ? old.status() : status,
                priority == null ? old.priority() : priority);
    }

    public boolean delete(long id) {
        return jdbc.update("DELETE FROM tasks WHERE id = ?", id) > 0;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
