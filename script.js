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

document.body.className = `theme-${currentTheme}`;

function changeTheme(t) { 
    document.body.className = `theme-${t}`; 
    localStorage.setItem('listme_theme', t); 
}

function showPage(p) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    document.getElementById(`${p}-page`).style.display = 'block';
    if(p === 'calendar') renderCalendar();
    if(p === 'todo') renderTodo();
    if(p === 'tasks') renderTasks();
}

// --- MES TÂCHES CLASSIQUES ---
function renderTasks() {
    const c = document.getElementById('task-list'); 
    c.innerHTML = '';
    
    tasks.sort((a,b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
    
    tasks.forEach(t => {
        const d = document.createElement('div');
        d.className = `task-card ${t.importance} ${t.completed ? 'completed' : ''}`;
        d.innerHTML = `
            <div style="flex:1" onclick="toggleTaskCheck(${t.id})">
                <strong style="${t.completed ? 'text-decoration:line-through; opacity:0.5;' : ''}">${t.name}</strong><br>
                <small>${t.date}</small>
            </div>
            <div class="task-actions">
                <button onclick="editTask(${t.id})" style="background:none; border:none; color:var(--primary); font-size:1.3rem; cursor:pointer;">✎</button>
                <button onclick="deleteTask(${t.id})" style="background:none; border:none; color:var(--danger); font-size:1.3rem; cursor:pointer;">×</button>
            </div>`;
        c.appendChild(d);
    });
}

function toggleTaskCheck(id) { 
    let i = tasks.findIndex(t => t.id === id); 
    tasks[i].completed = !tasks[i].completed; 
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
    const n = document.getElementById('task-name').value;
    const d = document.getElementById('task-date').value;
    const imp = document.getElementById('task-importance').value;
    
    if(n && d) {
        if(editingId) {
            let index = tasks.findIndex(t => t.id === editingId);
            tasks[index] = { ...tasks[index], name: n, date: d, importance: imp };
            editingId = null;
        } else {
            tasks.push({ name: n, date: d, importance: imp, id: Date.now(), completed: false });
        }
        saveTasks();
        document.getElementById('task-modal').style.display = 'none';
    }
};

// --- CALENDRIER THERMIQUE ---
function setViewState(s) { viewState = s; renderCalendar(); }

function renderCalendar() {
    const c = document.getElementById('calendar-content'); 
    const t = document.getElementById('calendar-title'); 
    c.innerHTML = '';
    
    document.querySelectorAll('#calendar-page .bubble').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${viewState}`).classList.add('active');

    if (viewState === 'year') {
        c.className = 'grid-years'; t.innerText = "Années";
        for (let i = selectedYear - 4; i <= selectedYear + 4; i++) {
            const d = document.createElement('div'); 
            d.className = `grid-item ${i === selectedYear ? 'selected' : ''}`;
            d.innerText = i; 
            d.onclick = () => { selectedYear = i; setViewState('month'); }; 
            c.appendChild(d);
        }
    } else if (viewState === 'month') {
        c.className = 'grid-months'; t.innerText = selectedYear;
        monthNames.forEach((n, i) => {
            const d = document.createElement('div'); 
            d.className = `grid-item ${i === selectedMonth ? 'selected' : ''}`;
            d.innerText = n; 
            d.onclick = () => { selectedMonth = i; setViewState('day'); }; 
            c.appendChild(d);
        });
    } else {
        c.className = 'calendar-grid'; 
        t.innerText = `${monthNames[selectedMonth]} ${selectedYear}`;
        const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        
        for (let i = 1; i <= days; i++) {
            const ds = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const div = document.createElement('div'); 
            div.className = 'day-card';
            
            const dt = tasks.filter(tk => tk.date === ds);
            if(dt.length > 0) {
                const imps = dt.map(tk => tk.importance);
                if(imps.includes('high')) div.classList.add('has-high');
                else if(imps.includes('medium')) div.classList.add('has-medium');
                else div.classList.add('has-low');
                
                // Correction clic : Affiche bien les tâches associées au jour
                div.onclick = () => {
                    alert(`Tâches du ${i} ${monthNames[selectedMonth]}:\n` + dt.map(tk => `- ${tk.name}`).join('\n'));
                };
            }
            
            div.innerHTML = `<span style="font-size:0.6rem; opacity:0.5; display:block;">${dayInitials[new Date(selectedYear, selectedMonth, i).getDay()]}</span><b>${i}</b>`;
            c.appendChild(div);
        }
    }
}

// --- TO-DO LIST (PLANNING) ---
function setTodoMode(m) { todoMode = m; renderTodo(); }

function renderTodo() {
    const c = document.getElementById('todo-content');
    document.querySelectorAll('#todo-page .bubble').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${todoMode}`).classList.add('active');
    document.getElementById('todo-today-date').innerText = new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
    
    if(todoMode === 'daily') {
        c.innerHTML = '<div class="schedule-container"></div>';
        const sc = c.querySelector('.schedule-container');
        for (let h = 8; h <= 20; h++) {
            const time = `${h.toString().padStart(2, '0')}:00`;
            const items = dailyTodo.filter(it => it.date === todayStr && it.time === time);
            sc.innerHTML += `
                <div class="time-slot">
                    <div class="time-label">${time}</div>
                    <div class="slot-content">
                        <div style="flex:1; cursor:pointer;" onclick="openTodoModal('${time}')">
                            ${items.map(it => `<div onclick="event.stopPropagation(); toggleTodo(${it.id})">${it.completed ? '✓' : '○'} ${it.name}</div>`).join('') || '...'}
                        </div>
                        <button onclick="openTodoModal('${time}')" style="background:none; border:none; color:var(--primary); font-size:1.2rem; cursor:pointer;">✎</button>
                    </div>
                </div>`;
        }
    } else { 
        c.innerHTML = '<div style="text-align:center; padding:50px; opacity:0.5;"><p style="font-size:3rem;">📅</p><p>Vue Hebdomadaire bientôt disponible !</p></div>'; 
    }
}

function openTodoModal(t) { 
    document.getElementById('todo-time').value = t; 
    document.getElementById('todo-modal').style.display = 'flex'; 
}

function toggleTodo(id) { 
    let i = dailyTodo.findIndex(it => it.id === id); 
    dailyTodo[i].completed = !dailyTodo[i].completed; 
    localStorage.setItem('listme_todo', JSON.stringify(dailyTodo)); 
    renderTodo(); 
}

document.getElementById('save-todo').onclick = () => {
    const n = document.getElementById('todo-task-name').value;
    const t = document.getElementById('todo-time').value;
    if(n) { 
        dailyTodo.push({ id: Date.now(), name: n, time: t, date: todayStr, completed: false }); 
        localStorage.setItem('listme_todo', JSON.stringify(dailyTodo)); 
        renderTodo(); 
        document.getElementById('todo-modal').style.display = 'none';
        document.getElementById('todo-task-name').value = '';
    }
};

// --- CONFIGURATION INITIALE ---
document.getElementById('add-task-btn').onclick = () => { 
    editingId = null; 
    document.getElementById('task-name').value = "";
    document.getElementById('task-date').value = todayStr; 
    document.getElementById('modal-title').innerText = "Nouvelle Tâche";
    document.getElementById('task-modal').style.display = 'flex'; 
};

document.getElementById('close-modal').onclick = () => document.getElementById('task-modal').style.display = 'none';

window.onclick = (e) => { 
    if(e.target.className === 'modal') { 
        document.getElementById('task-modal').style.display = 'none'; 
        document.getElementById('todo-modal').style.display = 'none'; 
    } 
};

showPage('tasks');
