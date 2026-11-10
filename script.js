
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const priorityInput = document.getElementById("priority-input");
const dateInput = document.getElementById("date-input");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");

const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const progressPercentage = document.getElementById("progress-percentage");
const progressCaption = document.getElementById("progress-caption");
const progressFill = document.getElementById("progress-fill");
const progressRing = document.getElementById("progress-ring");

const taskCounter = document.getElementById("task-counter");
const allFilterCount = document.getElementById("all-filter-count");

const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedButton = document.getElementById("clear-completed");

let tasks = JSON.parse(localStorage.getItem("daylightTasks")) || [];
let currentFilter = "all";
let editingTaskId = null;

// DISPLAY CURRENT DATE

function displayDate() {
    const date = new Date();

    document.getElementById("current-date").textContent =
        date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric"
        });
}

// SAVE TASKS

function saveTasks() {
    localStorage.setItem("daylightTasks", JSON.stringify(tasks));
}

// FORMAT DATE

function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// CHECK OVERDUE

function isOverdue(dateString) {
    if (!dateString) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dateString + "T00:00:00");

    return dueDate < today;
}

// ADD OR UPDATE TASK

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        taskInput.focus();
        return;
    }

    if (editingTaskId !== null) {
        tasks = tasks.map(task => {
            if (task.id === editingTaskId) {
                return {
                    ...task,
                    title: title,
                    priority: priorityInput.value,
                    dueDate: dateInput.value
                };
            }

            return task;
        });

        editingTaskId = null;
        document.querySelector(".add-btn").innerHTML = 'Add task <span>＋</span>';

    } else {
        const newTask = {
            id: Date.now().toString(),
            title: title,
            priority: priorityInput.value,
            dueDate: dateInput.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
    }

    saveTasks();
    renderTasks();

    taskForm.reset();
    priorityInput.value = "medium";
    taskInput.focus();
});

// RENDER TASKS

function renderTasks() {
    taskList.innerHTML = "";

    let filteredTasks = tasks;

    if (currentFilter === "active") {
        filteredTasks = tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        filteredTasks = tasks.filter(task => task.completed);
    }

    filteredTasks.forEach(task => {
        const taskElement = document.createElement("article");

        taskElement.className = `task-item ${task.completed ? "completed" : ""}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", `Complete ${task.title}`);

        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("p");
        title.className = "task-name";
        title.textContent = task.title;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priority = document.createElement("span");
        priority.className = `priority ${task.priority}`;
        priority.textContent = `${task.priority} priority`;

        meta.appendChild(priority);

        if (task.dueDate) {
            const date = document.createElement("span");
            date.className = `task-date ${isOverdue(task.dueDate) && !task.completed ? "overdue" : ""}`;

            date.textContent = isOverdue(task.dueDate) && !task.completed
                ? `Overdue · ${formatDate(task.dueDate)}`
                : `Due ${formatDate(task.dueDate)}`;

            meta.appendChild(date);
        }

        details.append(title, meta);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.className = "action-btn";
        editButton.innerHTML = "✎";
        editButton.title = "Edit task";
        editButton.setAttribute("aria-label", "Edit task");

        editButton.addEventListener("click", () => {
            editTask(task.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "action-btn delete-btn";
        deleteButton.innerHTML = "×";
        deleteButton.title = "Delete task";
        deleteButton.setAttribute("aria-label", "Delete task");

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.append(editButton, deleteButton);
        taskElement.append(checkbox, details, actions);

        taskList.appendChild(taskElement);
    });

    emptyState.style.display = filteredTasks.length === 0 ? "block" : "none";

    updateDashboard();
}

// TOGGLE COMPLETION

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}

// EDIT TASK

function editTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    taskInput.value = task.title;
    priorityInput.value = task.priority;
    dateInput.value = task.dueDate || "";

    editingTaskId = id;

    document.querySelector(".add-btn").innerHTML = 'Save changes <span>✓</span>';

    taskInput.focus();
    taskForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

// DELETE TASK

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);

    if (editingTaskId === id) {
        editingTaskId = null;
        taskForm.reset();
        document.querySelector(".add-btn").innerHTML = 'Add task <span>＋</span>';
    }

    saveTasks();
    renderTasks();
}

// FILTER TASKS

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");
        currentFilter = button.dataset.filter;

        renderTasks();
    });
});

// CLEAR COMPLETED

clearCompletedButton.addEventListener("click", () => {
    tasks = tasks.filter(task => !task.completed);

    editingTaskId = null;
    taskForm.reset();
    document.querySelector(".add-btn").innerHTML = 'Add task <span>＋</span>';

    saveTasks();
    renderTasks();
});

// UPDATE DASHBOARD

function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalCount.textContent = total;
    completedCount.textContent = completed;

    progressPercentage.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;

    progressRing.style.background =
        `conic-gradient(var(--green) ${percentage}%, #d4ddcf ${percentage}%)`;

    if (total === 0) {
        progressCaption.textContent = "Let's get started!";
    } else if (percentage === 100) {
        progressCaption.textContent = "Everything done. Amazing!";
    } else {
        progressCaption.textContent = `${completed} of ${total} tasks completed`;
    }

    taskCounter.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
    allFilterCount.textContent = total;
}

// INITIALIZE APP

displayDate();
renderTasks();
