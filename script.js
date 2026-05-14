let tasks = JSON.parse(localStorage.getItem('listme_tasks')) || [];
let viewState = 'day'; 
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const dayInitials = ["D", "L", "M", "M", "J", "V", "S"];

// NAVIGATION PAGES
function showPage(pageId) {
    document.getElementById('tasks-page').style.display = pageId === 'tasks' ? 'block' : 'none';
    document.getElementById('calendar-page').style.display = pageId === 'calendar' ? 'block' : 'none';
    if(pageId === 'calendar') renderCalendar();
}

// GESTION DES VUES CALENDRIER
function setViewState(state) {
    viewState = state;
    document.querySelectorAll('.bubble').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${state}`).classList.add('active');
    renderCalendar();
}

function renderCalendar() {
    const content = document.getElementById('calendar-content');
    const title = document.getElementById('calendar-title');
    content.innerHTML = '';
    content.className = ''; 

    if (viewState === 'year') {
        title.innerText = "Sélectionner l'Année";
        content.classList.add('grid-years');
        for (let i = selectedYear - 5; i <= selectedYear + 3; i++) {
            const div = document.createElement('div');
            div.className = `grid-item ${i === selectedYear ? 'selected' : ''}`;
            div.innerText = i;
            div.onclick = () => { selectedYear = i; setViewState('month'); };
            content.appendChild(div);
        }
    } 
    else if (viewState === 'month') {
        title.innerText = selectedYear;
        content.classList.add('grid-months');
        monthNames.forEach((name, index) => {
            const div = document.createElement('div');
            div.className = `grid-item ${index === selectedMonth ? 'selected' : ''}`;
            div.innerText = name;
            div.onclick = () => { selectedMonth = index; setViewState('day'); };
            content.appendChild(div);
        });
    } 
    else {
        title.innerText = `${monthNames[selectedMonth]} ${selectedYear}`;
        content.classList.add('calendar-grid');
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(selectedYear, selectedMonth, i);
            const initial = dayInitials[dateObj.getDay()];
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-card';
            dayDiv.innerHTML = `<span class="day-initial">${initial}</span><b>${i}</b>`;
            
            tasks.filter(t => t.date === dateStr).forEach(t => {
                dayDiv.innerHTML += `<div style="font-size:7px; color:var(--primary); margin-top:2px;">• ${t.name.substring(0,8)}</div>`;
            });
            content.appendChild(dayDiv);
        }
    }
}

// GESTION DES TÂCHES
const modal = document.getElementById('task-modal');
document.getElementById('add-task-btn').onclick = () => modal.style.display = 'flex';
document.getElementById('close-modal').onclick = () => modal.style.display = 'none';

document.getElementById('save-task').onclick = () => {
    const name = document.getElementById('task-name').value;
    const date = document.getElementById('task-date').value;
    const importance = document.getElementById('task-importance').value;

    if(name && date) {
        tasks.push({ name, date, importance, id: Date.now() });
        localStorage.setItem('listme_tasks', JSON.stringify(tasks));
        renderTasks();
        modal.style.display = 'none';
        document.getElementById('task-name').value = '';
    }
};

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('listme_tasks', JSON.stringify(tasks));
    renderTasks();
}

function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-card ${task.importance}`;
        div.innerHTML = `<div><strong>${task.name}</strong><br><small>${task.date}</small></div>
                         <button onclick="deleteTask(${task.id})" style="border:none; background:none; color:red; font-size:1.2rem;">×</button>`;
        container.appendChild(div);
    });
}

// Initialisation
renderTasks();
