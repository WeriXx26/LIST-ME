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

function showPage(pageId) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`${pageId}-page`);
    if (target) target.style.display = 'block';

    if(pageId === 'calendar') renderCalendar();
    if(pageId === 'todo') renderTodo();
    if(pageId === 'tasks') renderTasks();
    window.scrollTo(0,0);
}

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
                            ${items.map(it => `<div class="${it.completed ? 'todo-item-done' : ''}" onclick="event.stopPropagation(); toggleTodo(${it.id})">○ ${it.name}</div>`).join('')}
                        </div>
                        <button onclick="openTodoModal('${time}')" style="background:none; border:none; color:var(--primary); font-size:1.3rem;">✎</button>
                    </div>
                </div>`;
            }
        }
        content.innerHTML = html + '</div>';
    } else {
        content.innerHTML = '<p style="text-align:center; padding:50px; font-family:Mogra;">Vue Hebdo bientôt disponible !</p>';
    }
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
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-card';
            const dateObj = new Date(selectedYear, selectedMonth, i);
            dayDiv.innerHTML = `<span style="font-size:0.7rem; color:#aaa; display:block;">${dayInitials[dateObj.getDay()]}</span><b>${i}</b>`;
            content.appendChild(dayDiv);
        }
    }
}

// Boutons & Modals
document.getElementById('add-task-btn').onclick = () => { 
    editingId = null; 
    document.getElementById('task-date').value = todayStr;
    document.getElementById('task-modal').style.display = 'flex'; 
};
document.getElementById('close-modal').onclick = () => document.getElementById('task-modal').style.display = 'none';

function saveTasks() {
    localStorage.setItem('listme_tasks', JSON.stringify(tasks));
    renderTasks();
}

// Initialisation
renderTasks();
