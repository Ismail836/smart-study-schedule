/* =========================================================
   Smart Study Schedule — Builder logic
   Grid: 7 days x hourly slots (07:00 - 22:00). The plan is now
   stored in a real database (SQLite) via the /api/tasks REST
   endpoints served by server.js, instead of localStorage.
   ========================================================= */

(function () {
  "use strict";

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const START_HOUR = 7;
  const END_HOUR = 22; // exclusive
  const API_BASE = "/api/tasks";

  const grid = document.getElementById("builderGrid");
  const form = document.getElementById("taskForm");
  const modalEl = document.getElementById("taskModal");
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const slotLabel = document.getElementById("slotLabel");
  const deleteBtn = document.getElementById("deleteTaskBtn");
  const emptyState = document.getElementById("emptyState");

  const statHours = document.getElementById("statHours");
  const statTasks = document.getElementById("statTasks");
  const statBusiest = document.getElementById("statBusiest");
  const weekFillBar = document.getElementById("weekFillBar");
  const weekFillLabel = document.getElementById("weekFillLabel");

  let activeKey = null; // "day-hour" of the slot currently open in the modal
  let activeDay = null;
  let activeHour = null;
  let tasks = {}; // in-memory mirror of the DB, keyed "day-hour" same as before

  function keyFor(day, hour) {
    return day + "-" + hour;
  }

  function formatHour(h) {
    const period = h >= 12 ? "PM" : "AM";
    let hr = h % 12;
    if (hr === 0) hr = 12;
    return hr + " " + period;
  }

  // ---------- API helpers ----------

  async function fetchTasks() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error("Failed to load schedule from server.");
    return res.json();
  }

  async function upsertTask(day, hour, data) {
    const res = await fetch(`${API_BASE}/${day}/${hour}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save block.");
    return res.json();
  }

  async function deleteTask(day, hour) {
    const res = await fetch(`${API_BASE}/${day}/${hour}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to remove block.");
    return res.json();
  }

  async function clearAllTasks() {
    const res = await fetch(API_BASE, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to clear schedule.");
    return res.json();
  }

  // ---------- Rendering ----------

  function buildGrid() {
    if (!grid) return;
    grid.innerHTML = "";

    // header row
    const corner = document.createElement("div");
    corner.className = "g-cell g-head";
    corner.textContent = "";
    grid.appendChild(corner);

    DAYS.forEach((d) => {
      const head = document.createElement("div");
      head.className = "g-cell g-head";
      head.textContent = d;
      grid.appendChild(head);
    });

    for (let h = START_HOUR; h < END_HOUR; h++) {
      const timeCell = document.createElement("div");
      timeCell.className = "g-cell g-time";
      timeCell.textContent = formatHour(h);
      grid.appendChild(timeCell);

      DAYS.forEach((d) => {
        const cell = document.createElement("div");
        cell.className = "g-cell g-slot";
        const key = keyFor(d, h);
        cell.dataset.key = key;
        cell.dataset.day = d;
        cell.dataset.hour = h;
        renderCell(cell, key);
        cell.addEventListener("click", () => openSlot(d, h));
        grid.appendChild(cell);
      });
    }
  }

  function renderCell(cell, key) {
    const task = tasks[key];
    cell.innerHTML = "";
    if (task) {
      const chip = document.createElement("span");
      chip.className = "task-chip priority-" + task.priority;
      chip.textContent = task.subject;
      cell.appendChild(chip);
    }
  }

  function refreshAllCells() {
    if (!grid) return;
    grid.querySelectorAll(".g-slot").forEach((cell) => {
      renderCell(cell, cell.dataset.key);
    });
  }

  function openSlot(day, hour) {
    activeKey = keyFor(day, hour);
    activeDay = day;
    activeHour = hour;
    const existing = tasks[activeKey];
    slotLabel.textContent = day + " · " + formatHour(hour) + " – " + formatHour(hour + 1);
    form.reset();
    if (existing) {
      form.subject.value = existing.subject;
      form.priority.value = existing.priority;
      form.notes.value = existing.notes || "";
      deleteBtn.classList.remove("d-none");
    } else {
      deleteBtn.classList.add("d-none");
    }
    modal.show();
  }

  function updateStats() {
    const entries = Object.entries(tasks);
    const totalSlots = DAYS.length * (END_HOUR - START_HOUR);
    const filled = entries.length;

    if (statHours) statHours.textContent = filled;
    if (statTasks) statTasks.textContent = new Set(entries.map(([, t]) => t.subject.toLowerCase())).size;

    const perDay = {};
    DAYS.forEach((d) => (perDay[d] = 0));
    entries.forEach(([k]) => {
      const day = k.split("-")[0];
      perDay[day] = (perDay[day] || 0) + 1;
    });
    let busiest = "—";
    let max = 0;
    Object.entries(perDay).forEach(([d, c]) => {
      if (c > max) {
        max = c;
        busiest = d;
      }
    });
    if (statBusiest) statBusiest.textContent = max > 0 ? busiest : "—";

    const pct = totalSlots ? Math.round((filled / totalSlots) * 100) : 0;
    if (weekFillBar) weekFillBar.style.width = pct + "%";
    if (weekFillLabel) weekFillLabel.textContent = pct + "% of the week planned";

    if (emptyState) emptyState.classList.toggle("d-none", filled > 0);
  }

  // ---------- Event wiring ----------

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const subject = form.subject.value.trim();
      if (!subject) return;

      const data = {
        subject: subject,
        priority: form.priority.value,
        notes: form.notes.value.trim(),
      };

      try {
        await upsertTask(activeDay, activeHour, data);
        tasks[activeKey] = data;
        refreshAllCells();
        updateStats();
        modal.hide();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async function () {
      try {
        await deleteTask(activeDay, activeHour);
        delete tasks[activeKey];
        refreshAllCells();
        updateStats();
        modal.hide();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const clearAllBtn = document.getElementById("clearAllBtn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", async function () {
      if (!confirm("Clear the entire week? This can't be undone.")) return;
      try {
        await clearAllTasks();
        tasks = {};
        refreshAllCells();
        updateStats();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // ---------- Init ----------

  async function init() {
    buildGrid();
    try {
      tasks = await fetchTasks();
    } catch (err) {
      console.error(err);
      if (emptyState) {
        emptyState.classList.remove("d-none");
        emptyState.textContent = "Could not reach the server. Make sure it's running (npm start).";
      }
      tasks = {};
    }
    refreshAllCells();
    updateStats();
  }

  init();
})();
