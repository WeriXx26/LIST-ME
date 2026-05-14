let tasks = JSON.parse(localStorage.getItem('listme_tasks')) || [];
let viewState = 'day'; 
let todoMode = 'daily';
let editingId = null;
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const dayInitials = ["D", "L", "M", "M", "J", "V", "S"];
const importanceOrder = { 'high': 1, 'medium': 2, 'low': 3 };

function showPage(pageId) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    document.getElementById(`${pageId}-page`).style.display = 'block';
    if(pageId === 'calendar') renderCalendar();
    if(pageId === 'todo') renderTodo();
    if(pageId === 'tasks') renderTasks();
}

// --- GESTION DES TÂCHES ---
function toggleCheck(id) {
    const index = tasks.findIndex(t => t.id === id);
    tasks[index].completed = !tasks[index].completed;
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('listme_tasks', JSON.stringify(tasks));
    renderTasks();
}

function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    
    // TRI : d'abord les non-terminées par importance, puis les terminées
    tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return importanceOrder[a.importance] - importanceOrder[b.importance];
    });

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-card ${task.importance} ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="task-info" onclick="toggleCheck(${task.id})">
                <strong>${task.completed ? '✓ ' : ''}${task.name}</strong><br>
                <small>${task.date}</small>
            </div>
            <div class="task-actions">
                <button class="edit-btn" onclick="editTask(${task.id})">✎</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">×</button>
            </div>`;
        container.appendChild(div);
    });
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
    saveAndRefresh();
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
        saveAndRefresh();
        document.getElementById('task-modal').style.display = 'none';
        document.getElementById('task-name').value = '';
    }
};

// --- PLANNING (EMPOI DU TEMPS) ---
function setTodoMode(mode) {
    todoMode = mode;
    document.querySelectorAll('#todo-page .bubble').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${mode === 'daily' ? 'daily' : 'weekly'}`).classList.add('active');
    renderTodo();
}

function renderTodo() {
    const content = document.getElementById('todo-content');
    content.innerHTML = '';
    if(todoMode === 'daily') {
        let html = '<div class="schedule-container">';
        for (let h = 8; h <= 20; h++) {
            for (let m = 0; m < 60; m += 30) {
                const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                html += `<div class="time-slot"><div class="time-label">${time}</div><div class="slot-content" onclick="quickAdd('${time}')"></div></div>`;
            }
        }
        content.innerHTML = html + '</div>';
    } else {
        content.innerHTML = '<p style="text-align:center; padding:20px;">Vue Hebdo bientôt disponible.</p>';
    }
}

function quickAdd(time) {
    document.getElementById('task-name').value = `${time} : `;
    document.getElementById('task-modal').style.display = 'flex';
}

// --- CALENDRIER ---
function setViewState(state) {
    viewState = state;
    document.querySelectorAll('#calendar-page .bubble').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${state}`).classList.add('active');
    renderCalendar();
}

function renderCalendar() {
    const content = document.getElementById('calendar-content');
    const title = document.getElementById('calendar-title');
    content.innerHTML = '';
    content.className = '';

    if (viewState === 'year') {
        title.innerText = "Choisir l'Année";
        content.classList.add('grid-years');
        for (let i = selectedYear - 5; i <= selectedYear + 3; i++) {
            const div = document.createElement('div');
            div.className = `grid-item ${i === selectedYear ? 'selected' : ''}`;
            div.innerText = i;
            div.onclick = () => { selectedYear = i; setViewState('month'); };
            content.appendChild(div);
        }
    } else if (viewState === 'month') {
        title.innerText = selectedYear;
        content.classList.add('grid-months');
        monthNames.forEach((name, index) => {
            const div = document.createElement('div');
            div.className = `grid-item ${index === selectedMonth ? 'selected' : ''}`;
            div.innerText = name;
            div.onclick = () => { selectedMonth = index; setViewState('day'); };
            content.appendChild(div);
        });
    } else {
        title.innerText = `${monthNames[selectedMonth]} ${selectedYear}`;
        content.classList.add('calendar-grid');
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(selectedYear, selectedMonth, i);
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-card';
            dayDiv.innerHTML = `<span class="day-initial">${dayInitials[dateObj.getDay()]}</span><b>${i}</b>`;
            tasks.filter(t => t.date === dateStr).forEach(t => {
                dayDiv.innerHTML += `<div style="font-size:7px; color:${t.completed ? '#ccc' : 'var(--primary)'};">•</div>`;
            });
            content.appendChild(dayDiv);
        }
    }
}

// Initialisation
document.getElementById('add-task-btn').onclick = () => { editingId = null; document.getElementById('task-modal').style.display = 'flex'; };
document.getElementById('close-modal').onclick = () => { document.getElementById('task-modal').style.display = 'none'; };
renderTasks();
