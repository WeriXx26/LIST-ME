// --- INITIALISATION DES DONNÉES ---
let tasks = JSON.parse(localStorage.getItem('listme_tasks')) || [];
let dailyTodo = JSON.parse(localStorage.getItem('listme_todo')) || [];
let viewState = 'day'; 
let todoMode = 'daily';
let editingId = null;
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const dayInitials = ["D", "L", "M", "M", "J", "V", "S"];
const todayStr = new Date().toISOString().split('T')[0];

// --- NAVIGATION ENTRE LES PAGES ---
function showPage(pageId) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`${pageId}-page`);
    if (target) target.style.display = 'block';

    if(pageId === 'calendar') renderCalendar();
    if(pageId === 'todo') renderTodo();
    if(pageId === 'tasks') renderTasks();
    window.scrollTo(0,0);
}

// --- GESTION DES TÂCHES (ONGLET TÂCHES) ---
function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    
    tasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-card ${task.importance} ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="task-info" onclick="toggleTaskCheck(${task.id})">
                <strong>${task.completed ? '✓ ' : ''}${task.name}</strong><br><small>${task.date}</small>
            </div>
            <div class="task-actions">
                <button onclick="editTask(${task.id})" style="border:none; background:none; color:var(--primary); font-size:1.3rem; cursor:pointer;">✎</button>
                <button onclick="deleteTask(${task.id})" style="border:none; background:none; color:var(--danger); font-size:1.3rem; cursor:pointer;">×</button>
            </div>`;
        container.appendChild(div);
    });
}

function saveTasks() {
    localStorage.setItem('listme_tasks', JSON.stringify(tasks));
    renderTasks();
}

function toggleTaskCheck(id) {
    const idx = tasks.findIndex(t => t.id === id);
    tasks[idx].completed = !tasks[idx].completed;
    saveTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
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

// BOUTON ENREGISTRER (TASK)
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
    } else {
        alert("Veuillez remplir le nom et la date.");
    }
};

// --- GESTION TO-DO LIST (PLANNING) ---
function setTodoMode(mode) {
    todoMode = mode;
    document.querySelectorAll('#todo-page .bubble').forEach(b => b.classList.remove('active'));
    if(mode === 'daily') document.getElementById('btn-daily').classList.add('active');
    else document.getElementById('btn-weekly').classList.add('active');
    renderTodo();
}

function renderTodo() {
    const content = document.getElementById('todo-content');
    const dateTitle = document.getElementById('todo-today-date');
    if(dateTitle) dateTitle.innerText = new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
    
    content.innerHTML = '';
    if(todoMode === 'daily') {
        let html = '<div class="schedule-container">';
        for (let h = 8; h <= 20; h++) {
            for (let m = 0; m < 60; m += 30) {
                const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                const items = dailyTodo.filter(t => t.date === todayStr && t.time === time);
                html += `
                <div class="time-slot">
                    <div class="time-label">${time}</div>
                    <div class="slot-content">
                        <div style="flex:1" onclick="openTodoModal('${time}')">
                            ${items.map(it => `<div class="${it.completed ? 'todo-item-done' : ''}" onclick="event.stopPropagation(); toggleTodo(${it.id})">${it.completed ? '✓' : '○'} ${it.name}</div>`).join('')}
                        </div>
                        <button onclick="openTodoModal('${time}')" style="background:none; border:none; color:var(--primary); font-size:1.3rem; cursor:pointer;">✎</button>
                    </div>
                </div>`;
            }
        }
        content.innerHTML = html + '</div>';
    } else {
        content.innerHTML = '<p style="text-align:center; padding:50px; font-family:Mogra;">Vue Hebdo bientôt disponible !</p>';
    }
}

function openTodoModal(time) {
    document.getElementById('todo-time').value = time;
    document.getElementById('todo-modal').style.display = 'flex';
}

function toggleTodo(id) {
    const idx = dailyTodo.findIndex(t => t.id === id);
    dailyTodo[idx].completed = !dailyTodo[idx].completed;
    localStorage.setItem('listme_todo', JSON.stringify(dailyTodo));
    renderTodo();
}

document.getElementById('save-todo').onclick = () => {
    const name = document.getElementById('todo-task-name').value;
    const time = document.getElementById('todo-time').value;
    if(name) {
        dailyTodo.push({ id: Date.now(), name, time, date: todayStr, completed: false });
        localStorage.setItem('listme_todo', JSON.stringify(dailyTodo));
        renderTodo();
        document.getElementById('todo-modal').style.display = 'none';
        document.getElementById('todo-task-name').value = '';
    }
};

// --- GESTION CALENDRIER ---
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

    if (viewState === 'year') {
        content.className = 'grid-years';
        for (let i = selectedYear - 5; i <= selectedYear + 3; i++) {
            const div = document.createElement('div');
            div.className = `grid-item ${i === selectedYear ? 'selected' : ''}`;
            div.innerText = i;
            div.onclick = () => { selectedYear = i; setViewState('month'); };
            content.appendChild(div);
        }
    } else if (viewState === 'month') {
        content.className = 'grid-months';
        monthNames.forEach((name, index) => {
            const div = document.createElement('div');
            div.className = `grid-item ${index === selectedMonth ? 'selected' : ''}`;
            div.innerText = name;
            div.onclick = () => { selectedMonth = index; setViewState('day'); };
            content.appendChild(div);
        });
    } else {
        title.innerText = `${monthNames[selectedMonth]} ${selectedYear}`;
        content.className = 'calendar-grid';
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-card';
            const dayTasks = tasks.filter(t => t.date === dateStr);
            if(dayTasks.length > 0) {
                const imps = dayTasks.map(t => t.importance);
                if(imps.includes('high')) dayDiv.classList.add('has-high');
                else if(imps.includes('medium')) dayDiv.classList.add('has-medium');
                else dayDiv.classList.add('has-low');
                dayDiv.onclick = () => alert(`Tâches du ${i}:\n` + dayTasks.map(t => `- ${t.name}`).join('\n'));
            }
            const dateObj = new Date(selectedYear, selectedMonth, i);
            dayDiv.innerHTML = `<span style="font-size:0.6rem; color:#aaa; display:block;">${dayInitials[dateObj.getDay()]}</span><b>${i}</b>`;
            content.appendChild(dayDiv);
        }
    }
}

// --- INITIALISATION ---
document.getElementById('add-task-btn').onclick = () => { 
    editingId = null; 
    document.getElementById('modal-title').innerText = "Nouvelle Tâche";
    document.getElementById('task-name').value = "";
    document.getElementById('task-date').value = todayStr;
    document.getElementById('task-modal').style.display = 'flex'; 
};

document.getElementById('close-modal').onclick = () => {
    document.getElementById('task-modal').style.display = 'none';
};

// Fermer les modals en cliquant à côté
window.onclick = (event) => {
    if (event.target.className === 'modal') {
        document.getElementById('task-modal').style.display = 'none';
        document.getElementById('todo-modal').style.display = 'none';
    }
};

renderTasks();
