let editIndex = null;

// ✅ Validate current user
const currentUser = sessionStorage.getItem("sessionUser") || localStorage.getItem("sessionUser");
if (!currentUser) {
  window.location.href = "login.html";
}

// ✅ Task key scoped per user
function getUserTaskKey() {
  return `tasks:${currentUser}`;
}

// ✅ Toast Feedback
function showToast(message) {
  const toastMsg = document.getElementById("toastMsg");
  toastMsg.innerText = message;
  const toast = new bootstrap.Toast(document.getElementById("toast"));
  toast.show();
}

// ✅ Load & Save
function loadTasks() {
  return JSON.parse(localStorage.getItem(getUserTaskKey()) || "[]");
}

function saveTasks(tasks) {
  localStorage.setItem(getUserTaskKey(), JSON.stringify(tasks));
}

// ✅ Check if task is due today/tomorrow
function isDueTodayOrTomorrow(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const taskDate = new Date(dateStr);
  const diff = (taskDate - today) / (1000 * 3600 * 24);
  return diff >= 0 && diff < 2;
}

// ✅ Render Tasks
function renderTasks() {
  const taskList = document.getElementById("taskList");
  const search = document.getElementById("searchBox").value.toLowerCase();
  const filter = document.getElementById("filterPriority").value;
  const sort = document.getElementById("sortOption").value;

  const tasks = loadTasks().filter(task => {
    if (task.dueDate) {
      const due = new Date(task.dueDate);
      const now = new Date();
      if (due.setHours(0,0,0,0) < now.setHours(0,0,0,0)) return false;
    }
    return true;
  });

  let filtered = tasks;
  if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search));
  if (filter) filtered = filtered.filter(t => t.priority === filter);
  if (sort === "due") filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  if (sort === "priority") {
    const order = { Low: 1, Medium: 2, High: 3 };
    filtered.sort((a, b) => order[b.priority] - order[a.priority]);
  }

  taskList.innerHTML = "";
  filtered.forEach((task, i) => {
    const badge = `badge-${task.priority.toLowerCase()}`;
    const completedClass = task.completed ? "task-completed" : "";
    const dueSoon = isDueTodayOrTomorrow(task.dueDate) ? "due-soon" : "";

    const card = document.createElement("div");
    card.className = "col-md-6 mb-3";
    card.innerHTML = `
      <div class="card task-card ${dueSoon}">
        <div class="card-body ${completedClass}">
          <h5 class="card-title d-flex justify-content-between align-items-center">
            ${task.title}
            <span class="badge ${badge}">${task.priority}</span>
          </h5>
          <p>${task.description || ""}</p>
          <p><strong>Status:</strong> ${task.status}<br><strong>Due:</strong> ${task.dueDate || "N/A"}</p>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="chk${i}" ${task.completed ? "checked" : ""} onchange="toggleComplete(${i})">
            <label class="form-check-label" for="chk${i}">Completed</label>
          </div>
          <button class="btn btn-sm btn-primary mt-2 me-2" onclick="editTask(${i})">Edit</button>
          <button class="btn btn-sm btn-danger mt-2" onclick="deleteTask(${i})">Delete</button>
        </div>
      </div>
    `;
    taskList.appendChild(card);
  });
}

// ✅ Add/Edit task logic
document.getElementById("taskForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  if (!title) return;

  const desc = document.getElementById("taskDesc").value;
  const due = document.getElementById("taskDate").value;
  const priority = document.getElementById("taskPriority").value;
  const status = document.getElementById("taskStatus").value;

  const tasks = loadTasks();

  if (editIndex !== null) {
    tasks[editIndex] = { ...tasks[editIndex], title, description: desc, dueDate: due, priority, status };
    showToast("Task updated.");
    editIndex = null;
  } else {
    tasks.push({ title, description: desc, dueDate: due, priority, status, completed: false });
    showToast("Task added.");
  }

  saveTasks(tasks);
  this.reset();
  renderTasks();
});

// ✅ Edit
function editTask(index) {
  const task = loadTasks()[index];
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDesc").value = task.description;
  document.getElementById("taskDate").value = task.dueDate;
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskStatus").value = task.status;
  editIndex = index;
  showToast("Editing task...");
}

// ✅ Delete
function deleteTask(index) {
  const tasks = loadTasks();
  tasks.splice(index, 1);
  saveTasks(tasks);
  showToast("Task deleted.");
  renderTasks();
}

// ✅ Complete toggle
function toggleComplete(index) {
  const tasks = loadTasks();
  tasks[index].completed = !tasks[index].completed;
  saveTasks(tasks);
  renderTasks();
}

// ✅ Export
function exportTasksToCSV() {
  const tasks = loadTasks();
  const rows = [["Title", "Description", "Due Date", "Priority", "Status", "Completed"]];
  tasks.forEach(t =>
    rows.push([t.title, t.description, t.dueDate, t.priority, t.status, t.completed ? "Yes" : "No"])
  );
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.csv";
  a.click();
}

// ✅ Filters
document.getElementById("searchBox").addEventListener("input", renderTasks);
document.getElementById("filterPriority").addEventListener("change", renderTasks);
document.getElementById("sortOption").addEventListener("change", renderTasks);

// ✅ Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("sessionUser");
  localStorage.removeItem("sessionUser");
  window.location.href = "login.html";
});

// ✅ Show user + render
document.getElementById("currentUser").innerText = currentUser;
renderTasks();