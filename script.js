let tasks = JSON.parse(localStorage.getItem('listme_tasks')) || [];

// Navigation
function showPage(pageId) {
    document.getElementById('tasks-page').style.display = pageId === 'tasks' ? 'block' : 'none';
    document.getElementById('calendar-page').style.display = pageId === 'calendar' ? 'block' : 'none';
    if(pageId === 'calendar') renderCalendar();
}

// Modal management
const modal = document.getElementById('task-modal');
document.getElementById('add-task-btn').onclick = () => modal.style.display = 'flex';
document.getElementById('close-modal').onclick = () => modal.style.display = 'none';

// Ajouter une tâche
document.getElementById('save-task').onclick = () => {
    const name = document.getElementById('task-name').value;
    const date = document.getElementById('task-date').value;
    const importance = document.getElementById('task-importance').value;

    if(name && date) {
        tasks.push({ name, date, importance });
        localStorage.setItem('listme_tasks', JSON.stringify(tasks));
        renderTasks();
        modal.style.display = 'none';
        // Reset form
        document.getElementById('task-name').value = '';
    } else {
        alert("Remplis tous les champs !");
    }
};

// Afficher les tâches
function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-card ${task.importance}`;
        div.innerHTML = `<strong>${task.name}</strong> <br> <small>${task.date}</small>`;
        container.appendChild(div);
    });
}

// Rendu simple du calendrier (Mois en cours)
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    // On crée 30 jours pour l'exemple
    for (let i = 1; i <= 30; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        const dateStr = `2024-05-${i < 10 ? '0'+i : i}`; // Format simplifié
        dayDiv.innerHTML = `<b>${i}</b>`;
        
        // Vérifier si une tâche correspond à ce jour
        const dayTasks = tasks.filter(t => t.date === dateStr);
        dayTasks.forEach(t => {
            dayDiv.innerHTML += `<div style="font-size:10px; color:blue;">• ${t.name}</div>`;
        });
        
        grid.appendChild(dayDiv);
    }
}

// Initialisation
renderTasks();
