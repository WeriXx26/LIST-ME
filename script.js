let tasks = JSON.parse(localStorage.getItem('listme_tasks')) || [];
let dailyTodo = JSON.parse(localStorage.getItem('listme_todo')) || [];
let viewState = 'day'; 
let todoMode = 'daily';
let editingId = null;

const importanceOrder = { 'high': 1, 'medium': 2, 'low': 3 };
const todayStr = new Date().toISOString().split('T')[0];

// --- INITIALISATION : REPORT AUTOMATIQUE ---
function autoReport() {
    let hasChanged = false;
    dailyTodo.forEach(item => {
        if (!item.completed && item.date < todayStr) {
            item.date = todayStr; // On reporte à aujourd'hui
            hasChanged = true;
        }
    });
    if (hasChanged) localStorage.setItem('listme_todo', JSON.stringify(dailyTodo));
}
autoReport();

function showPage(pageId) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    document.getElementById(`${pageId}-page`).style.display = 'block';
    if(pageId === 'calendar') renderCalendar();
    if(pageId === 'todo') renderTodo();
    if(pageId === 'tasks') renderTasks();
}

// --- GESTION TO-DO LIST (JOURNALIER) ---
function renderTodo() {
    const content = document.getElementById('todo-content');
    document.getElementById('todo-today-date').innerText = new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
    content.innerHTML = '';

    if(todoMode === 'daily') {
        let html = '<div class="schedule-container">';
        for (let h = 8; h <= 20; h++) {
            for (let m = 0; m < 60; m += 30) {
                const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                // Trouver les items pour cette tranche horaire
                const items = dailyTodo.filter(t => t.date === todayStr && t.time === time);
                
                html += `
                <div class="time-slot">
                    <div class="time-label">${time}</div>
                    <div class="slot-content">
                        <div style="flex:1" onclick="openTodoModal('${time}')">
                            ${items.map(it => `<span class="${it.completed ? 'todo-item-done' : ''}" onclick="event.stopPropagation(); toggleTodo(${it.id})">${it.name}</span>`).join('<br>')}
                        </div>
                        <button onclick="openTodoModal('${time}')" style="background:none; border:none; color:var(--primary)">✎</button>
                    </div>
                </div>`;
            }
        }
        content.innerHTML = html + '</div>';
    } else {
        content.innerHTML = '<p style="text-align:center; padding:20px;">Vue Hebdo bientôt disponible.</p>';
    }
}

function openTodoModal(time) {
    document.getElementById('todo-time').value = time;
    document.getElementById('todo-modal').style.display = 'flex';
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

function toggleTodo(id) {
    const idx = dailyTodo.findIndex(t => t.id === id);
    dailyTodo[idx].completed = !dailyTodo[idx].completed;
    localStorage.setItem('listme_todo', JSON.stringify(dailyTodo));
    renderTodo();
}

// --- GESTION TÂCHES CLASSIQUES & CALENDRIER (Reste du code identique) ---
// (Note : Gardez vos fonctions renderTasks, editTask, deleteTask, renderCalendar du bloc précédent ici)
