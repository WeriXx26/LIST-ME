let tasks = JSON.parse(localStorage.getItem('listme_tasks')) || [];

function showPage(pageId) {
    document.getElementById('tasks-page').style.display = pageId === 'tasks' ? 'block' : 'none';
    document.getElementById('calendar-page').style.display = pageId === 'calendar' ? 'block' : 'none';
    if(pageId === 'calendar') renderCalendar();
}

const modal = document.getElementById('task-modal');
document.getElementById('add-task-btn').onclick = () => modal.style.display = 'flex';
document.getElementById('close-modal').onclick = () => modal.style.display = 'none';

document.getElementById('save-task').onclick = () => {
    const name = document.getElementById('task-name').value;
    const date = document.getElementById('task-date').value;
    const importance = document.getElementById('task-importance').value;

    if(name && date) {
        tasks.push({ name, date, importance, id: Date.now() });
        saveAndRefresh();
        modal.style.display = 'none';
        document.getElementById('task-name').value = '';
    } else {
        alert("Veuillez remplir tous les champs.");
    }
};

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('listme_tasks', JSON.stringify(tasks));
    renderTasks();
}

function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = tasks.length === 0 ? '<p style="text-align:center; color:grey;">Aucune tâche pour le moment.</p>' : '';
    
    // Trier par date
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-card ${task.importance}`;
        div.innerHTML = `
            <div>
                <strong>${task.name}</strong><br>
                <small>${new Date(task.date).toLocaleDateString('fr-FR')}</small>
            </div>
            <button onclick="deleteTask(${task.id})" style="background:none; border:none; color:red; font-size:20px;">×</button>
        `;
        container.appendChild(div);
    });
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dayDiv.innerHTML = `<b>${i}</b>`;
        
        tasks.filter(t => t.date === dateStr).forEach(t => {
            dayDiv.innerHTML += `<div style="font-size:8px; color:var(--primary); overflow:hidden; white-space:nowrap;">• ${t.name}</div>`;
        });
        grid.appendChild(dayDiv);
    }
}

// Init au chargement
renderTasks();
