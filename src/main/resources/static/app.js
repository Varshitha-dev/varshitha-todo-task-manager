const API = "/api/tasks";
const state = { status: "Pending", page: 1, pageSize: 10, tasks: [], filtered: [] };
const $ = (id) => document.getElementById(id);
const dialog = $("taskDialog");
const form = $("taskForm");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function prettyDate(value) {
  if (!value) return "—";
  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}
function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2600);
}
function showAlert(message) {
  const node = $("alert");
  node.textContent = message;
  node.hidden = !message;
}
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  if (!response.ok) {
    let body;
    try { body = await response.json(); } catch { body = null; }
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  return response.json();
}
function getQuery() {
  const params = new URLSearchParams();
  params.set("status", state.status);
  params.set("priority", $("priorityFilter").value);
  const search = $("searchInput").value.trim();
  if (search) params.set("search", search);
  if ($("overdueOnly").checked) params.set("overdue", "true");
  return params.toString();
}
async function loadTasks() {
  showAlert("");
  $("taskRows").innerHTML = '<tr><td colspan="7" class="loading">Loading tasks…</td></tr>';
  try {
    state.tasks = await request(`${API}?${getQuery()}`);
    const dueDate = $("deadlineFilter").value;
    state.filtered = dueDate ? state.tasks.filter(t => t.deadline === dueDate) : state.tasks;
    state.page = Math.min(state.page, Math.max(1, Math.ceil(state.filtered.length / state.pageSize)));
    render();
  } catch (error) {
    $("taskRows").innerHTML = '<tr><td colspan="7" class="empty-cell">Could not load tasks.</td></tr>';
    showAlert(`${error.message}. Check that the Spring Boot server is running.`);
  }
}
function render() {
  const tasks = state.filtered;
  const total = tasks.length;
  const start = (state.page - 1) * state.pageSize;
  const pageTasks = tasks.slice(start, start + state.pageSize);
  $("totalCount").textContent = `${state.tasks.length} task${state.tasks.length === 1 ? "" : "s"}`;
  $("pendingCount").textContent = `${state.tasks.filter(t => t.status === "Pending").length} pending`;
  $("emptyState").hidden = total !== 0;
  $("taskRows").innerHTML = pageTasks.map(task => {
    const statusClass = task.status === "Completed" ? "status-completed" : "status-pending";
    const priorityClass = `priority-${task.priority.toLowerCase()}`;
    const dueText = task.overdue ? `<span class="overdue-label">Overdue</span>` : "";
    const completedActions = task.status === "Completed"
      ? `<button class="action view" title="View task" data-action="view" data-id="${task.id}">◎</button>`
      : `<button class="action edit" title="Edit task" data-action="edit" data-id="${task.id}">♢</button><button class="action delete" title="Delete task" data-action="delete" data-id="${task.id}">▤</button>`;
    return `<tr>
      <td><div class="task-title" title="${escapeHtml(task.title)}">${escapeHtml(task.title)}${dueText}</div></td>
      <td><span class="badge ${priorityClass}">${escapeHtml(task.priority)}</span></td>
      <td><span class="badge ${statusClass}">${escapeHtml(task.status)}</span></td>
      <td>Me</td>
      <td>${prettyDate(task.createdAt?.slice(0,10))}</td>
      <td>${prettyDate(task.deadline)}</td>
      <td><div class="row-actions">
        <button class="action" title="${task.status === "Completed" ? "Mark pending" : "Mark completed"}" data-action="toggle" data-id="${task.id}">${task.status === "Completed" ? "↶" : "✓"}</button>
        ${completedActions}
        <button class="action more" title="More actions" data-action="more" data-id="${task.id}">⋮</button>
      </div></td></tr>`;
  }).join("");
  if (!pageTasks.length) $("taskRows").innerHTML = "";
  $("pageSummary").textContent = total ? `${start + 1}–${Math.min(start + state.pageSize, total)} of ${total}` : "0–0 of 0";
  $("prevPage").disabled = state.page <= 1;
  $("nextPage").disabled = start + state.pageSize >= total;
}
function openCreate() {
  form.reset();
  $("taskId").value = "";
  $("priorityInput").value = "Medium";
  $("statusInput").value = "Pending";
  $("dialogTitle").textContent = "Create new task";
  $("dialogEyebrow").textContent = "TASK DETAILS";
  $("saveButton").textContent = "Save task";
  $("formError").hidden = true;
  dialog.showModal();
  $("titleInput").focus();
}
async function openEdit(id, readOnly = false) {
  try {
    const task = await request(`${API}/${id}`);
    form.reset();
    $("taskId").value = task.id;
    $("titleInput").value = task.title;
    $("descriptionInput").value = task.description || "";
    $("deadlineInput").value = task.deadline || "";
    $("priorityInput").value = task.priority;
    $("statusInput").value = task.status;
    $("dialogTitle").textContent = readOnly ? "Task details" : "Edit task";
    $("dialogEyebrow").textContent = readOnly ? "TASK OVERVIEW" : "UPDATE TASK";
    $("saveButton").textContent = readOnly ? "Close" : "Save changes";
    $("formError").hidden = true;
    ["titleInput","descriptionInput","deadlineInput","priorityInput","statusInput"].forEach(id => $(id).disabled = readOnly);
    $("saveButton").type = readOnly ? "button" : "submit";
    $("saveButton").onclick = readOnly ? () => dialog.close() : null;
    dialog.showModal();
  } catch (error) { toast(error.message); }
}
function closeDialog() {
  dialog.close();
  ["titleInput","descriptionInput","deadlineInput","priorityInput","statusInput"].forEach(id => $(id).disabled = false);
  $("saveButton").type = "submit";
  $("saveButton").onclick = null;
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = $("titleInput").value.trim();
  if (!title) {
    $("formError").textContent = "Please enter a task title.";
    $("formError").hidden = false;
    $("titleInput").focus();
    return;
  }
  const payload = {
    title,
    description: $("descriptionInput").value.trim(),
    deadline: $("deadlineInput").value || null,
    priority: $("priorityInput").value,
    status: $("statusInput").value
  };
  const id = $("taskId").value;
  $("saveButton").disabled = true;
  try {
    await request(id ? `${API}/${id}` : API, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
    closeDialog();
    toast(id ? "Task updated successfully" : "Task created successfully");
    await loadTasks();
  } catch (error) {
    $("formError").textContent = error.message;
    $("formError").hidden = false;
  } finally { $("saveButton").disabled = false; }
});
$("taskRows").addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  try {
    if (action === "edit") await openEdit(id);
    if (action === "view") await openEdit(id, true);
    if (action === "toggle") {
      const task = await request(`${API}/${id}`);
      await request(`${API}/${id}`, { method: "PATCH", body: JSON.stringify({ status: task.status === "Completed" ? "Pending" : "Completed" }) });
      toast("Task status updated");
      await loadTasks();
    }
    if (action === "delete") {
      const task = await request(`${API}/${id}`);
      if (confirm(`Delete “${task.title}”? This cannot be undone.`)) {
        await request(`${API}/${id}`, { method: "DELETE" });
        toast("Task deleted");
        await loadTasks();
      }
    }
    if (action === "more") {
      const task = await request(`${API}/${id}`);
      const choice = prompt(`More actions for: ${task.title}\nType "edit", "view", "delete", or "toggle":`);
      if (choice === "edit") await openEdit(id);
      else if (choice === "view") await openEdit(id, true);
      else if (choice === "delete") {
        if (confirm(`Delete “${task.title}”?`)) { await request(`${API}/${id}`, { method: "DELETE" }); await loadTasks(); toast("Task deleted"); }
      } else if (choice === "toggle") {
        await request(`${API}/${id}`, { method: "PATCH", body: JSON.stringify({ status: task.status === "Completed" ? "Pending" : "Completed" }) });
        await loadTasks(); toast("Task status updated");
      }
    }
  } catch (error) { toast(error.message); }
});
function selectStatus(status) {
  state.status = status;
  $("statusFilter").value = status;
  document.querySelectorAll(".tab").forEach(tab => {
    const selected = tab.dataset.status === status;
    tab.classList.toggle("selected", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
}
document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  selectStatus(tab.dataset.status);
  state.page = 1;
  loadTasks();
}));
$("statusFilter").addEventListener("change", () => {
  selectStatus($("statusFilter").value);
  state.page = 1;
  loadTasks();
});
$("advancedToggle").addEventListener("click", () => {
  const panel = $("advancedFilters");
  const opening = panel.hidden;
  panel.hidden = !opening;
  $("advancedToggle").setAttribute("aria-expanded", String(opening));
  $("advancedToggle").innerHTML = opening ? 'Fewer filters <span>⌃</span>' : 'More filters <span>⌄</span>';
});
$("createButton").addEventListener("click", openCreate);
$("emptyCreateButton").addEventListener("click", openCreate);
$("closeDialog").addEventListener("click", closeDialog);
$("cancelDialog").addEventListener("click", closeDialog);
$("filterButton").addEventListener("click", () => { state.page = 1; loadTasks(); });
$("clearFilters").addEventListener("click", () => {
  $("deadlineFilter").value = "";
  $("priorityFilter").value = "All";
  $("searchInput").value = "";
  $("overdueOnly").checked = false;
  selectStatus("All");
  state.page = 1;
  loadTasks();
});
$("searchInput").addEventListener("keydown", event => { if (event.key === "Enter") { state.page = 1; loadTasks(); } });
$("focusSearch").addEventListener("click", () => {
  if ($("advancedFilters").hidden) {
    $("advancedFilters").hidden = false;
    $("advancedToggle").setAttribute("aria-expanded", "true");
    $("advancedToggle").innerHTML = 'Fewer filters <span>⌃</span>';
  }
  $("searchInput").focus();
});
$("notifyButton").addEventListener("click", () => toast("You're all caught up."));
$("pageSize").addEventListener("change", event => { state.pageSize = Number(event.target.value); state.page = 1; render(); });
$("prevPage").addEventListener("click", () => { state.page--; render(); });
$("nextPage").addEventListener("click", () => { state.page++; render(); });
selectStatus(state.status);
loadTasks();
