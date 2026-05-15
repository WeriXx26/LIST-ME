// --- INITIALISATION ---
let tasks = JSON.parse(localStorage.getItem('listme_tasks')) || [];
let dailyTodo = JSON.parse(localStorage.getItem('listme_todo')) || [];
let viewState = 'day'; 
let todoMode = 'daily';
let editingId = null;
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const dayInitials = ["D", "L", "M", "M", "J", "V", "S"];
const importanceOrder = { 'high': 1, 'medium': 2, 'low': 3 };

// Calcul de la date du jour au format YYYY-MM-DD
const todayStr = new Date().toISOString().split('T')[0];

// --- REPORT AUTOMATIQUE ---
function autoReport() {
    let hasChanged = false;
    dailyTodo.forEach(item => {
        if (!item.completed && item.date < todayStr) {
            item.date = todayStr;
            hasChanged = true;
        }
    });
    if (hasChanged) localStorage.setItem('listme_todo', JSON.stringify(dailyTodo));
}
autoReport();

// --- NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    document.getElementById(`${pageId}-page`).style.display = 'block';
    if(pageId === 'calendar') renderCalendar();
    if(pageId === 'todo') renderTodo();
    if(pageId === 'tasks') renderTasks();
}

// --- PAGE TÂCHES (Correction Couleurs & Tri) ---
function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    
    // Tri : Non-complétées d'abord (par importance), puis complétées
    tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return importanceOrder[a.importance] - importanceOrder[b.importance];
    });

    tasks.forEach(task => {
        const div = document.createElement('div');
        // Application stricte des classes d'importance pour le CSS
        div.className = `task-card ${task.importance} ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="task-info" onclick="toggleTaskCheck(${task.id})">
                <strong>${task.completed ? '✓ ' : ''}${task.name}</strong><br>
                <small>${task.date}</small>
            </div>
            <div class="task-actions">
                <button onclick="editTask(${task.id})" class="edit-btn">✎</button>
                <button onclick="deleteTask(${task.id})" class="delete-btn">×</button>
            </div>`;
        container.appendChild(div);
    });
}

// Ouvrir modal avec DATE DU JOUR PAR DÉFAUT
document.getElementById('add-task-btn').onclick = () => { 
    editingId = null; 
    document.getElementById('modal-title').innerText = "Nouvelle Tâche";
    document.getElementById('task-name').value = "";
    document.getElementById('task-date').value = todayStr; // Date du jour
    document.getElementById('task-modal').style.display = 'flex'; 
};

function toggleTaskCheck(id) {
    const idx = tasks.findIndex(t => t.id === id);
    tasks[idx].completed = !tasks[idx].completed;
    saveTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if(task) {
        editingId = id;
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-importance').value = task.importance;
        document.getElementById('modal-title').innerText = "Modifier la tâche";
        document.getElementById('task-modal').style.display = 'flex';
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
}

function saveTasks() {
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
        saveTasks();
        document.getElementById('task-modal').style.display = 'none';
    }
};

// --- TO-DO LIST (Planning Journalier) ---
function setTodoMode(mode) {
    todoMode = mode;
    document.querySelectorAll('#todo-page .bubble').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${mode === 'daily' ? 'daily' : 'weekly'}`).classList.add('active');
    renderTodo();
}

function renderTodo() {
    const content = document.getElementById('todo-content');
    const dateTitle = document.getElementById('todo-today-date');
