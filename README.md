# To-Do Task Manager

A responsive task manager based on the supplied dashboard reference. Built with **Java 17, Spring Boot, plain HTML/CSS/JavaScript, and SQLite**. The browser uses REST APIs; SQLite persists tasks to `./data/tasks.db`.

## Features

- Create, list, read, replace, partially update, and delete tasks
- Required title and field-length validation with useful error responses
- Pending / Completed status, plus Low / Medium / High priority
- Filter by status, priority, deadline, and overdue state
- Case-insensitive search over title and description
- Overdue badges for tasks with a past deadline that are not completed
- Responsive sidebar/dashboard, task table, modal editor, and pagination
- Database created automatically on first startup

## Requirements

- JDK 17 or newer
- Maven 3.6+ (or use your IDE's Maven integration)
- Internet access on first build to download Maven dependencies

## Run locally

From this directory:

```bash
mvn spring-boot:run
```

Open **http://localhost:8080**. The database is stored at `data/tasks.db`; it is not committed to the source project. Stop and restart the server to verify persistence.

Build a runnable JAR:

```bash
mvn clean package
java -jar target/todo-task-manager-1.0.0.jar
```

If port 8080 is busy, set `SERVER_PORT=8081` or change `server.port` in `src/main/resources/application.properties`.

## REST API

Base URL: `http://localhost:8080/api/tasks`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks, with optional filters |
| GET | `/api/tasks/{id}` | Get one task |
| POST | `/api/tasks` | Create a task (returns 201) |
| PUT | `/api/tasks/{id}` | Replace task fields |
| PATCH | `/api/tasks/{id}` | Update selected fields |
| DELETE | `/api/tasks/{id}` | Delete a task (returns 204) |

### Query parameters

- `status=All|Pending|Completed` (default `All`)
- `priority=All|Low|Medium|High` (default `All`)
- `search=meeting` (searches title and description)
- `overdue=true` (past deadline and not completed)

Combine parameters, for example:
`GET /api/tasks?status=Pending&priority=High&search=report&overdue=true`

Dates use ISO format: `YYYY-MM-DD`. Status values are `Pending` and `Completed`; priority values are `Low`, `Medium`, and `High`.

### Example API tests with curl

Create a task:

```bash
curl -i -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Prepare project presentation","description":"Draft slides and review them","deadline":"2026-10-31","priority":"High","status":"Pending"}'
```

List all tasks:

```bash
curl -i "http://localhost:8080/api/tasks?status=All"
```

Search and filter:

```bash
curl -i "http://localhost:8080/api/tasks?status=Pending&priority=High&search=presentation"
curl -i "http://localhost:8080/api/tasks?overdue=true"
```

Read one task (replace `1` with the returned ID):

```bash
curl -i http://localhost:8080/api/tasks/1
```

Replace a task (PUT expects all task fields; deadline may be `null`):

```bash
curl -i -X PUT http://localhost:8080/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated presentation","description":"Finalize slides","deadline":"2026-11-02","priority":"Medium","status":"Pending"}'
```

Partially update status:

```bash
curl -i -X PATCH http://localhost:8080/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"Completed"}'
```

Delete:

```bash
curl -i -X DELETE http://localhost:8080/api/tasks/1
```

Validation check (expected HTTP 400):

```bash
curl -i -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"   "}'
```

Missing task check (expected HTTP 404):

```bash
curl -i http://localhost:8080/api/tasks/999999
```

## HTTP response guide

- `200 OK`: successful read/update
- `201 Created`: task created
- `204 No Content`: task deleted
- `400 Bad Request`: invalid field, empty title, invalid JSON/date, or invalid status/priority
- `404 Not Found`: task ID does not exist

## Data model

`tasks`: `id`, `title`, `description`, `deadline`, `status`, `priority`, `created_at`, `updated_at`.

SQLite schema is initialized from `src/main/resources/schema.sql`. The application creates the `data/` directory before connecting to SQLite via the startup initializer below.

## Notes

- The task list's "Created by" column is a UI placeholder (`Me`); this project does not implement authentication or multiple users.
- The dashboard tabs are mapped to All, Pending, and Completed tasks.
- This starter does not include deployment credentials or a hosted deployment. For production deployment, use persistent disk storage for the SQLite file and configure HTTPS and access controls.
