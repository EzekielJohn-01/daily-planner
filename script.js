
let tasks = JSON.parse(localStorage.getItem("dailyPlannerTasks")) || [];

let currentFilter = "all";
let editingTaskId = null;
let calendarDate = new Date();
let selectedDate = null;
let searchQuery = "";
let sortOption = "default";
let categoryFilter = "all";

// NOTIFICATION SETTINGS
const notificationButton = document.getElementById("enable-notifications");
const notificationStatus = document.getElementById("notification-status");

let notificationsEnabled =
    localStorage.getItem("dailyPlannerNotifications") === "true";

let sentReminders = JSON.parse(
    localStorage.getItem("dailyPlannerSentReminders") || "[]"
);

// DISPLAY CURRENT DATE
function displayDate() {
    const today = new Date();

    document.getElementById("current-date").textContent =
        today.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
}

// SAVE TASKS
function saveTasks() {
    localStorage.setItem("dailyPlannerTasks", JSON.stringify(tasks));
}

// CREATE UNIQUE TASK ID
function createTaskId() {
    return Date.now().toString() + Math.random().toString(36).slice(2);
}

// CHECK OVERDUE TASK
function isOverdue(task) {
    if (task.completed || !task.dueDate || !task.dueTime) {
        return false;
    }

    const deadline = new Date(`${task.dueDate}T${task.dueTime}`);

    return !isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
}


// UPDATE WEEKLY ACTIVITY CHART
function updateWeeklyActivity() {
    const totalElement = document.getElementById("weekly-activity-total");
    const caption = document.getElementById("weekly-chart-caption");

    if (!totalElement || !caption) {
        return;
    }

    const today = new Date();

    // GET MONDAY OF THE CURRENT WEEK
    const monday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    const currentDay = monday.getDay();

    monday.setDate(
        monday.getDate() + (currentDay === 0 ? -6 : 1 - currentDay)
    );

    const dailyCounts = Array(7).fill(0);

    // COUNT COMPLETED TASKS BASED ON COMPLETION DATE
    tasks.forEach(task => {
        if (!task.completed || !task.completedAt) {
            return;
        }

        const completedDate = new Date(task.completedAt);

        if (isNaN(completedDate.getTime())) {
            return;
        }

        const completedDay = new Date(
            completedDate.getFullYear(),
            completedDate.getMonth(),
            completedDate.getDate()
        );

        const difference = Math.round(
            (completedDay - monday) / (1000 * 60 * 60 * 24)
        );

        if (difference >= 0 && difference < 7) {
            dailyCounts[difference]++;
        }
    });

    const weeklyTotal = dailyCounts.reduce(
        (total, count) => total + count,
        0
    );

    const highestCount = Math.max(...dailyCounts, 1);

    // UPDATE WEEKLY TOTAL
    totalElement.textContent = weeklyTotal;

    // UPDATE BAR CHART
    dailyCounts.forEach((count, index) => {
        const bar = document.getElementById(`weekly-bar-${index + 1}`);
        const countElement = document.getElementById(`weekly-count-${index + 1}`);

        if (bar) {
            const height = count === 0
                ? 0
                : (count / highestCount) * 100;

            bar.style.height = `${height}%`;
        }

        if (countElement) {
            countElement.textContent = count;
        }
    });

    // DISPLAY CURRENT WEEK RANGE
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const dateOptions = {
        month: "short",
        day: "numeric"
    };

    const startDate = monday.toLocaleDateString("en-US", dateOptions);
    const endDate = sunday.toLocaleDateString("en-US", dateOptions);

    caption.textContent = `Your activity from ${startDate} to ${endDate}`;
}

// UPDATE SUMMARY
function updateSummary() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    document.getElementById("total-tasks").textContent = total;
    document.getElementById("completed-tasks").textContent = completed;
    document.getElementById("pending-tasks").textContent = pending;

    updateWeeklyActivity();
}

// GET CATEGORY LABEL
function getCategoryLabel(category) {
    const categories = {
        School: "📚 School",
        Personal: "👤 Personal",
        Work: "💼 Work",
        Others: "📌 Others"
    };

    return categories[category] || "📌 Others";
}

// GET CATEGORY CLASS
function getCategoryClass(category) {
    const categoryClasses = {
        School: "school",
        Personal: "personal",
        Work: "work",
        Others: "others"
    };

    return categoryClasses[category] || "others";
}

// GET REPEAT LABEL
function getRepeatLabel(value) {
    const repeatOptions = {
        daily: "Every Day",
        weekly: "Every Week",
        monthly: "Every Month"
    };

    return repeatOptions[value] || "Does Not Repeat";
}

// GET NEXT RECURRING DATE
function getNextRecurringDate(task) {
    const date = new Date(`${task.dueDate}T00:00:00`);

    if (task.repeat === "daily") {
        date.setDate(date.getDate() + 1);

    } else if (task.repeat === "weekly") {
        date.setDate(date.getDate() + 7);

    } else if (task.repeat === "monthly") {
        const originalDay = task.repeatDay || date.getDate();

        const nextMonth = date.getMonth() + 1;
        const nextYear = date.getFullYear() + Math.floor(nextMonth / 12);
        const month = nextMonth % 12;

        const lastDayOfMonth = new Date(
            nextYear,
            month + 1,
            0
        ).getDate();

        date.setFullYear(
            nextYear,
            month,
            Math.min(originalDay, lastDayOfMonth)
        );
    }

    return formatDate(date);
}

// CREATE NEXT RECURRING TASK
function createNextRecurringTask(task) {
    if (!task.repeat || task.repeat === "none") {
        return;
    }

    const existingNextTask = tasks.some(
        item => item.id === task.nextTaskId
    );

    if (task.nextTaskId && existingNextTask) {
        return;
    }

    const nextDate = getNextRecurringDate(task);

    const nextTask = {
        id: createTaskId(),
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        category: task.category || "Others",
        dueDate: nextDate,
        dueTime: task.dueTime,
        reminderMinutes: task.reminderMinutes ?? "none",
        repeat: task.repeat,
        repeatDay: task.repeatDay || Number(task.dueDate.slice(8, 10)),
        completed: false
    };

    tasks.push(nextTask);
    task.nextTaskId = nextTask.id;

    saveTasks();
}

// DISPLAY TASKS
function displayTasks() {
    const taskList = document.getElementById("task-list");

    let filteredTasks = tasks;

    if (currentFilter === "pending") {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter === "completed") {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }

    if (categoryFilter !== "all") {
        filteredTasks = filteredTasks.filter(
            task => (task.category || "Others") === categoryFilter
        );
    }

    if (selectedDate) {
        filteredTasks = filteredTasks.filter(
            task => task.dueDate === selectedDate
        );
    }

    if (searchQuery.trim() !== "") {
        const search = searchQuery.toLowerCase();

        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(search) ||
            (task.description || "").toLowerCase().includes(search) ||
            task.priority.toLowerCase().includes(search) ||
            (task.category || "Others").toLowerCase().includes(search)
        );
    }

    filteredTasks = [...filteredTasks];

    if (sortOption === "high") {
        const priorityOrder = {
            High: 1,
            Medium: 2,
            Low: 3
        };

        filteredTasks.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );

    } else if (sortOption === "medium") {
        const priorityOrder = {
            Medium: 1,
            High: 2,
            Low: 3
        };

        filteredTasks.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );

    } else if (sortOption === "low") {
        const priorityOrder = {
            Low: 1,
            Medium: 2,
            High: 3
        };

        filteredTasks.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );

    } else if (sortOption === "date") {
        filteredTasks.sort((a, b) => {
            const dateA = new Date(`${a.dueDate}T${a.dueTime}`).getTime();
            const dateB = new Date(`${b.dueDate}T${b.dueTime}`).getTime();

            return dateA - dateB;
        });
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                ${searchQuery.trim() !== ""
                    ? "No matching tasks found."
                    : selectedDate
                        ? "No tasks scheduled for this date."
                        : categoryFilter !== "all"
                            ? "No tasks found in this category."
                            : "No tasks found. Add a new task to get started!"}
            </div>
        `;
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => {
        let status = "";
        let statusClass = "";

        if (task.completed) {
            status = "Completed";
            statusClass = "completed-status";
        } else if (isOverdue(task)) {
            status = "Overdue";
            statusClass = "overdue-status";
        } else {
            status = "Pending";
            statusClass = "pending-status";
        }

        const overdueClass = isOverdue(task) ? "overdue" : "";
        const completedClass = task.completed ? "completed" : "";

        const category = task.category || "Others";
        const categoryClass = getCategoryClass(category);

        return `
            <div class="task-item ${overdueClass} ${completedClass}">
                <div class="task-top">
                    <div class="task-info">
                        <h3>${escapeHTML(task.title)}</h3>
                        <p>${escapeHTML(task.description || "No description provided.")}</p>
                    </div>

                    <span class="priority-badge ${task.priority.toLowerCase()}">
                        ${escapeHTML(task.priority)}
                    </span>
                </div>

                <div class="task-details">
                    <span class="category-badge ${categoryClass}">
                        ${getCategoryLabel(category)}
                    </span>

                    <span>📅 ${escapeHTML(task.dueDate)}</span>
                    <span>🕒 ${escapeHTML(task.dueTime)}</span>

                    ${task.reminderMinutes !== undefined && task.reminderMinutes !== "none"
                        ? `<span>🔔 ${getReminderLabel(task.reminderMinutes)}</span>`
                        : ""}

                    ${task.repeat && task.repeat !== "none"
                        ? `<span>🔁 ${getRepeatLabel(task.repeat)}</span>`
                        : ""}
                </div>

                <div class="task-status">
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </div>

                <div class="task-actions">
                    <button class="complete-btn" onclick="toggleTask('${task.id}')">
                        ${task.completed ? "Undo" : "Complete"}
                    </button>

                    <button class="edit-btn" onclick="editTask('${task.id}')">
                        Edit
                    </button>

                    <button class="delete-btn" onclick="deleteTask('${task.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// ESCAPE HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

// GET REMINDER LABEL
function getReminderLabel(value) {
    const minutes = Number(value);

    if (value === "none" || value === undefined) {
        return "No Reminder";
    }

    if (minutes === 0) {
        return "At Due Time";
    }

    return `${minutes} Minutes Before`;
}

// OPEN ADD TASK MODAL
document.getElementById("add-task-btn").addEventListener("click", () => {
    editingTaskId = null;

    document.getElementById("task-form").reset();
    document.getElementById("modal-title").textContent = "Add New Task";
    document.getElementById("task-modal").classList.add("show");
});

// CLOSE MODAL
document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("task-modal").classList.remove("show");
});

document.getElementById("task-modal").addEventListener("click", event => {
    if (event.target.id === "task-modal") {
        document.getElementById("task-modal").classList.remove("show");
    }
});

// ADD OR EDIT TASK
document.getElementById("task-form").addEventListener("submit", event => {
    event.preventDefault();

    const title = document.getElementById("task-title").value.trim();
    const description = document.getElementById("task-description").value.trim();
    const priority = document.getElementById("task-priority").value;
    const category = document.getElementById("task-category").value;
    const dueDate = document.getElementById("task-date").value;
    const dueTime = document.getElementById("task-time").value;
    const reminderMinutes = document.getElementById("task-reminder").value;
    const repeat = document.getElementById("task-repeat").value;

    if (!title || !dueDate || !dueTime) {
        alert("Please complete all required fields.");
        return;
    }

    if (editingTaskId) {
        const task = tasks.find(task => task.id === editingTaskId);

        if (task) {
            const dateChanged = task.dueDate !== dueDate;

            task.title = title;
            task.description = description;
            task.priority = priority;
            task.category = category;
            task.dueDate = dueDate;
            task.dueTime = dueTime;
            task.reminderMinutes = reminderMinutes;
            task.repeat = repeat;

            if (dateChanged || !task.repeatDay) {
                task.repeatDay = Number(dueDate.slice(8, 10));
            }
        }
    } else {
        tasks.push({
            id: createTaskId(),
            title,
            description,
            priority,
            category,
            dueDate,
            dueTime,
            reminderMinutes,
            repeat,
            repeatDay: Number(dueDate.slice(8, 10)),
            completed: false
        });
    }

    saveTasks();
    updateSummary();
    displayTasks();
    displayCalendar();
    checkTaskReminders();

    document.getElementById("task-modal").classList.remove("show");
    document.getElementById("task-form").reset();

    editingTaskId = null;
});

// EDIT TASK
function editTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    editingTaskId = id;

    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-category").value = task.category || "School";
    document.getElementById("task-date").value = task.dueDate;
    document.getElementById("task-time").value = task.dueTime;

    document.getElementById("task-reminder").value =
        task.reminderMinutes !== undefined ? task.reminderMinutes : "none";

    document.getElementById("task-repeat").value =
        task.repeat || "none";

    document.getElementById("modal-title").textContent = "Edit Task";
    document.getElementById("task-modal").classList.add("show");
}

// COMPLETE OR UNDO TASK
function toggleTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    task.completed = !task.completed;

    if (task.completed) {
        task.completedAt = new Date().toISOString();
        createNextRecurringTask(task);
    } else {
        task.completedAt = null;
    }

    saveTasks();
    updateSummary();
    displayTasks();
    displayCalendar();
}

// DELETE TASK - CUSTOM CONFIRMATION MODAL
let taskToDelete = null;

function deleteTask(id) {
    taskToDelete = id;

    document.getElementById("delete-confirm-modal").classList.add("show");
}

// CONFIRM DELETE TASK
document.getElementById("confirm-delete-button").addEventListener("click", () => {
    if (!taskToDelete) return;

    tasks = tasks.filter(task => task.id !== taskToDelete);

    saveTasks();
    updateSummary();
    displayTasks();
    displayCalendar();

    taskToDelete = null;

    document.getElementById("delete-confirm-modal").classList.remove("show");
});

// FILTER TASKS
document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        currentFilter = button.dataset.filter;

        displayTasks();
    });
});

// SEARCH TASKS
document.getElementById("search-task").addEventListener("input", event => {
    searchQuery = event.target.value;
    displayTasks();
});

// SORT TASKS
document.getElementById("sort-tasks").addEventListener("change", event => {
    sortOption = event.target.value;
    displayTasks();
});

// CATEGORY FILTER
document.getElementById("filter-category").addEventListener("change", event => {
    categoryFilter = event.target.value;
    displayTasks();
});

// DISPLAY CALENDAR
function displayCalendar() {
    const calendarGrid = document.getElementById("calendar-grid");
    const monthLabel = document.getElementById("calendar-month");

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    monthLabel.textContent = calendarDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let calendarHTML = dayNames.map(day => `
        <div class="calendar-day-name">${day}</div>
    `).join("");

    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div class="calendar-date empty"></div>`;
    }

    const todayString = formatDate(new Date());

    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = [
            year,
            String(month + 1).padStart(2, "0"),
            String(day).padStart(2, "0")
        ].join("-");

        const hasTasks = tasks.some(task => task.dueDate === dateString);
        const isToday = dateString === todayString;
        const isSelected = dateString === selectedDate;

        let classes = "calendar-date";

        if (isToday) classes += " today";
        if (isSelected) classes += " selected";

        calendarHTML += `
            <button
                type="button"
                class="${classes}"
                data-date="${dateString}"
            >
                <span>${day}</span>
                ${hasTasks ? '<span class="task-dot"></span>' : ""}
            </button>
        `;
    }

    calendarGrid.innerHTML = calendarHTML;

    calendarGrid.querySelectorAll(".calendar-date[data-date]").forEach(button => {
        button.addEventListener("click", () => {
            selectedDate = button.dataset.date;

            displayCalendar();
            displayTasks();
            updateSelectedDateInfo();
        });
    });

    updateSelectedDateInfo();
}

// FORMAT DATE
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// UPDATE SELECTED DATE INFO
function updateSelectedDateInfo() {
    const info = document.getElementById("selected-date-info");

    if (!selectedDate) {
        info.textContent = "Select a date to view its tasks.";
        return;
    }

    const date = new Date(`${selectedDate}T00:00:00`);

    const formattedDate = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    const count = tasks.filter(task => task.dueDate === selectedDate).length;

    info.textContent = `${formattedDate} — ${count} ${count === 1 ? "task" : "tasks"} scheduled`;
}


// PREVIOUS MONTH
const previousMonthButton = document.getElementById("prev-month");

if (previousMonthButton) {
    previousMonthButton.addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        displayCalendar();
    });
}

// NEXT MONTH
const nextMonthButton = document.getElementById("next-month");

if (nextMonthButton) {
    nextMonthButton.addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        displayCalendar();
    });
}


// =====================================
// NOTIFICATION SETTINGS
// =====================================

// UPDATE NOTIFICATION STATUS
function updateNotificationStatus() {
    if (!notificationButton || !notificationStatus) {
        return;
    }

    if (!("Notification" in window)) {
        notificationStatus.textContent =
            "Your browser does not support notifications.";

        notificationButton.textContent = "Enable Notifications";
        notificationButton.disabled = true;
        return;
    }

    if (!window.isSecureContext) {
        notificationStatus.textContent =
            "Notifications require HTTPS or localhost.";

        notificationButton.textContent = "Enable Notifications";
        notificationButton.disabled = true;
        return;
    }

    notificationButton.disabled = false;

    if (notificationsEnabled && Notification.permission === "granted") {
        notificationButton.textContent = "🔕 Disable Notifications";
        notificationStatus.textContent = "Notifications are enabled.";
    } else {
        notificationButton.textContent = "🔔 Enable Notifications";
        notificationStatus.textContent = "Notifications are disabled.";
    }
}

// ENABLE OR DISABLE NOTIFICATIONS
if (notificationButton) {
    notificationButton.addEventListener("click", async () => {

        if (notificationsEnabled) {
            notificationsEnabled = false;

            localStorage.setItem("dailyPlannerNotifications", "false");

            updateNotificationStatus();

            return;
        }

        if (!("Notification" in window)) {
            alert("Your browser does not support notifications.");
            return;
        }

        if (!window.isSecureContext) {
            alert("Please open Daily Planner using HTTPS or localhost.");
            return;
        }

        if (Notification.permission === "denied") {
            alert(
                "Notifications are blocked. Please allow them in your browser settings."
            );

            updateNotificationStatus();
            return;
        }

        try {
            let permission = Notification.permission;

            if (permission === "default") {
                permission = await Notification.requestPermission();
            }

            if (permission === "granted") {
                notificationsEnabled = true;

                localStorage.setItem("dailyPlannerNotifications", "true");

                updateNotificationStatus();

                const testNotification = new Notification("Daily Planner", {
                    body: "Notifications have been enabled successfully!"
                });

                testNotification.onclick = () => {
                    window.focus();
                    testNotification.close();
                };

                checkTaskReminders();

            } else {
                alert("Please allow notifications in your browser settings.");
            }

        } catch (error) {
            console.error("Notification error:", error);
            alert("Unable to enable notifications.");
        }

        updateNotificationStatus();
    });
}

// SAVE SENT REMINDERS
function saveSentReminders() {
    localStorage.setItem(
        "dailyPlannerSentReminders",
        JSON.stringify(sentReminders)
    );
}

// CHECK TASK REMINDERS
function checkTaskReminders() {
    if (
        !notificationsEnabled ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }

    const now = Date.now();

    tasks.forEach(task => {
        if (task.completed || !task.dueDate || !task.dueTime) {
            return;
        }

        if (
            task.reminderMinutes === undefined ||
            task.reminderMinutes === "none"
        ) {
            return;
        }

        const deadline = new Date(`${task.dueDate}T${task.dueTime}`);

        if (isNaN(deadline.getTime())) {
            return;
        }

        const reminderMinutes = Number(task.reminderMinutes);

        if (isNaN(reminderMinutes)) {
            return;
        }

        const reminderTime =
            deadline.getTime() - reminderMinutes * 60 * 1000;

        if (now < reminderTime || now > deadline.getTime() + 60000) {
            return;
        }

        const reminderKey = [
            task.id,
            task.dueDate,
            task.dueTime,
            task.reminderMinutes
        ].join("_");

        if (sentReminders.includes(reminderKey)) {
            return;
        }

        let message = "";

        if (reminderMinutes === 0) {
            message = "Your task is due now!";
        } else {
            message = `Your task is due in ${reminderMinutes} minutes.`;
        }

        try {
            const notification = new Notification(
                `⏰ ${task.title}`,
                {
                    body: message,
                    tag: reminderKey
                }
            );

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            sentReminders.push(reminderKey);
            saveSentReminders();

        } catch (error) {
            console.error("Unable to show task reminder:", error);
        }
    });
}

// CHECK REMINDERS EVERY 15 SECONDS
setInterval(checkTaskReminders, 15000);

// =====================================
// DARK MODE AND LIGHT MODE
// =====================================

const themeButton = document.getElementById("theme-toggle");

function applyTheme() {
    const savedTheme = localStorage.getItem("dailyPlannerTheme") || "light";

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeButton.textContent = "☀️ Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        themeButton.textContent = "🌙 Dark Mode";
    }
}

if (themeButton) {
    themeButton.addEventListener("click", () => {
        const isDarkMode = document.body.classList.toggle("dark-mode");

        if (isDarkMode) {
            localStorage.setItem("dailyPlannerTheme", "dark");
            themeButton.textContent = "☀️ Light Mode";
        } else {
            localStorage.setItem("dailyPlannerTheme", "light");
            themeButton.textContent = "🌙 Dark Mode";
        }
    });

    applyTheme();
}

// INITIAL DISPLAY
displayDate();
updateSummary();
displayTasks();
displayCalendar();

updateNotificationStatus();
checkTaskReminders();

// DISABLE PULL-TO-REFRESH
let touchStartY = 0;

document.addEventListener("touchstart", function (event) {
    touchStartY = event.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchmove", function (event) {
    const currentY = event.touches[0].clientY;
    const scrollTop = document.documentElement.scrollTop;

    if (scrollTop <= 0 && currentY > touchStartY) {
        event.preventDefault();
    }
}, { passive: false });
