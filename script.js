let tasks = JSON.parse(localStorage.getItem('listme_tasks')) || [];
let dailyTodo = JSON.parse(localStorage.getItem('listme_todo')) || [];
let currentTheme = localStorage.getItem('listme_theme') || 'pink';
let viewState = 'day'; 
let todoMode = 'daily';
let editingId = null;
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const dayInitials = ["D", "L", "M", "M", "J", "V", "S"];
const todayStr = new Date().toISOString().split('T')[0];

// Appliquer le thème sauvegardé au démarrage
document.body.className = `theme-${currentTheme}`;

function changeTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('listme_theme', themeName);
}

function showPage(pageId) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`${pageId}-page`);
    if (target) target.style.display = 'block';
    if(pageId === 'calendar') renderCalendar();
    if(pageId === 'todo') renderTodo();
    if(pageId === 'tasks') renderTasks();
    window.scrollTo(0,0);
}

// --- TÂCHES ---
function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    tasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-card ${task.importance} ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div style="flex:1" onclick="toggleTaskCheck(${task.id})">
                <strong style="${task.completed ? 'text-decoration:line-through; font-style:italic; opacity:0.6;' : ''}">${task.completed ? '✓ ' : ''}${task.name}</strong><br><small>${task.date}</small>
            </div>
            <div>
                <button onclick="editTask(${task.id})" style="background:none; border:none; color:var(--primary); font-size:1.2rem; margin-right:10px;">✎</button>
                <button onclick="deleteTask(${task.id})" style="background:none; border:none; color:var(--danger); font-size:1.2rem;">×</button>
            </div>`;
        container.appendChild(div);
    });
}

function toggleTaskCheck(id) {
    const idx = tasks.findIndex(t => t.id === id);
    tasks[idx].completed = !tasks[idx].completed;
    localStorage.setItem('listme_tasks', JSON.stringify(tasks));
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if(task) {
        editingId = id;
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-importance').value = task.importance;
        document.getElementById('task-modal').style.display = 'flex';
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('listme_tasks', JSON.stringify(tasks));
    renderTasks();
}

document.getElementById('save-task').onclick = () => {
    const name = document.getElementById('task-name').value;
    const date = document.getElementById('task-date').value;
    const importance = document.getElementById('task-importance').value;
    if(name && date) {
        if(editingId) {
            const index = tasks.findIndex(t => t.id === editingId);
            tasks[index] = { ...tasks[index], name, date, importance };
            editingId = null;
        } else {
            tasks.push({ name, date, importance, id: Date.now(), completed: false });
        }
        localStorage.setItem('listme_tasks', JSON.stringify(tasks));
        renderTasks();
        document.getElementById('task-modal').style.display = 'none';
    }
};

// --- PLANNING & CALENDRIER (Fonctions simplifiées pour le bloc) ---
function setTodoMode(mode) { todoMode = mode; renderTodo(); }
function setViewState(state) { viewState = state; renderCalendar(); }

function renderTodo() {
    const content = document.getElementById('todo-content');
    document.getElementById('todo-today-date').innerText = new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
    content.innerHTML = '<div class="schedule-container">';
    for (let h = 8; h <= 20; h++) {
        const time = `${h.toString().padStart(2, '0')}:00`;
        const items = dailyTodo.filter(t => t.date === todayStr && t.time === time);
        content.innerHTML += `<div class="time-slot"><div class="time-label">${time}</div><div class="slot-content"><div onclick="openTodoModal('${time}')">${items.length ? items[0].name : '...'}</div></div></div>`;
    }
    content.innerHTML += '</div>';
}

function openTodoModal(time) { document.getElementById('todo-time').value = time; document.getElementById('todo-modal').style.display = 'flex'; }

document.getElementById('save-todo').onclick = () => {
    const name = document.getElementById('todo-task-name').value;
    const time = document.getElementById('todo-time').value;
    if(name) {
        dailyTodo.push({ id: Date.now(), name, time, date: todayStr, completed: false });
        localStorage.setItem('listme_todo', JSON.stringify(dailyTodo));
        renderTodo();
        document.getElementById('todo-modal').style.display = 'none';
    }
};

function renderCalendar() {
    const content = document.getElementById('calendar-content');
    content.innerHTML = '';
    if (viewState === 'day') {
        content.className = 'calendar-grid';
        const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        for (let i = 1; i <= days; i++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const hasTask = tasks.some(t => t.date === dateStr);
            content.innerHTML += `<div class="day-card ${hasTask ? 'has-high' : ''}"><b>${i}</b></div>`;
        }
    }
}

document.getElementById('add-task-btn').onclick = () => { editingId = null; document.getElementById('task-date').value = todayStr; document.getElementById('task-modal').style.display = 'flex'; };
document.getElementById('close-modal').onclick = () => document.getElementById('task-modal').style.display = 'none';

renderTasks();
