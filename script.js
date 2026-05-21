// --- CONFIGURATION FIREBASE PROD ---
const firebaseConfig = {
  apiKey: "AIzaSyAVkf6PEZnPWLrS1smnau0J6k3ZE1wGX-4",
  authDomain: "listme-2620d.firebaseapp.com",
  projectId: "listme-2620d",
  storageBucket: "listme-2620d.firebasestorage.app",
  messagingSenderId: "145966801688",
  appId: "1:145966801688:web:34638000fbafaff5bd346d",
  measurementId: "G-ERX6N3R6XK"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- VARIABLES D'ÉTAT LOCALES ---
let tasks = [];
let dailyTodo = [];
let weeklyTodo = [];
let currentUser = null; 
let unsubscribeTasks, unsubscribeDaily, unsubscribeWeekly; 

let currentTheme = localStorage.getItem('listme_theme') || 'pink';
let viewState = 'day'; 
let todoMode = 'daily';
let editingId = null;
let editingTodoId = null; // Pour l'édition de l'agenda
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const dayInitials = ["D", "L", "M", "M", "J", "V", "S"];
const dayNamesFr = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const todayStr = new Date().toISOString().split('T')[0];
const currentDayOfWeek = new Date().getDay();

document.body.className = `theme-${currentTheme}`;

function changeTheme(t) { 
    document.body.className = `theme-${t}`; 
    localStorage.setItem('listme_theme', t); 
}

function showPage(p) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`${p}-page`);
    if (target) target.style.display = 'block';
    
    if(p === 'calendar') renderCalendar();
    if(p === 'todo') renderTodo();
    if(p === 'tasks') renderTasks();
}

// --- SURVEILLANCE DE L'ÉTAT DE CONNEXION ---
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('profile-user-email').innerText = user.email;
        startRealtimeSync(user.uid); 
        showPage('tasks');
    } else {
        currentUser = null;
        document.getElementById('main-nav').style.display = 'none';
        stopRealtimeSync();
        document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
        document.getElementById('auth-page').style.display = 'block';
    }
});

// --- SYNCHRONISATION PRIVÉE (Filtrée par UID) ---
function startRealtimeSync(userId) {
    unsubscribeTasks = db.collection("tasks").where("userId", "==", userId)
        .onSnapshot((snapshot) => {
            tasks = [];
            snapshot.forEach((doc) => {
                let data = doc.data(); data.id = doc.id; tasks.push(data);
            });
            renderTasks();
            if(viewState === 'day') renderCalendar();
        });

    unsubscribeDaily = db.collection("dailyTodo").where("userId", "==", userId)
        .onSnapshot((snapshot) => {
            dailyTodo = [];
            snapshot.forEach((doc) => {
                let data = doc.data(); data.id = doc.id; dailyTodo.push(data);
            });
            renderTodo();
        });

    unsubscribeWeekly = db.collection("weeklyTodo").where("userId", "==", userId)
        .onSnapshot((snapshot) => {
            weeklyTodo = [];
            snapshot.forEach((doc) => {
                let data = doc.data(); data.id = doc.id; weeklyTodo.push(data);
            });
            renderTodo();
        });
}

function stopRealtimeSync() {
    if (unsubscribeTasks) unsubscribeTasks();
    if (unsubscribeDaily) unsubscribeDaily();
    if (unsubscribeWeekly) unsubscribeWeekly();
    tasks = []; dailyTodo = []; weeklyTodo = [];
}

// --- LOGIQUE D'AUTHENTIFICATION ---
document.getElementById('btn-login').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    if(email && pass) {
        auth.signInWithEmailAndPassword(email, pass).catch(err => alert("Erreur : " + err.message));
    }
};

document.getElementById('btn-register').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    if(email && pass) {
        auth.createUserWithEmailAndPassword(email, pass)
            .then(() => alert("Compte créé avec succès !"))
            .catch(err => alert("Erreur d'inscription : " + err.message));
    }
};

document.getElementById('btn-google').onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((err) => { alert("Erreur Google : " + err.message); });
};

document.getElementById('btn-logout').onclick = () => { auth.signOut(); };

// --- ONGLET : MES TÂCHES CLASSIQUES ---
function renderTasks() {
    const c = document.getElementById('task-list'); 
    if (!c) return; c.innerHTML = '';
    tasks.sort((a,b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
    tasks.forEach(t => {
        const d = document.createElement('div');
        d.className = `task-card ${t.importance} ${t.completed ? 'completed' : ''}`;
        d.innerHTML = `
            <div style="flex:1" onclick="toggleTaskCheck('${t.id}', ${t.completed})">
                <strong style="${t.completed ? 'text-decoration:line-through; opacity:0.5;' : ''}">${t.name}</strong><br>
                <small>📅 ${t.date} ${t.time ? '⏰ ' + t.time : ''}</small>
                ${t.reminder && t.reminder !== 'none' ? `<br><small style="color:var(--primary-dark);">🔔 Rappel : ${t.reminder} min avant</small>` : ''}
            </div>
            <div class="task-actions">
                <button onclick="editTask('${t.id}')" style="background:none; border:none; color:var(--primary); font-size:1.3rem; cursor:pointer;">✎</button>
                <button onclick="deleteTask('${t.id}')" style="background:none; border:none; color:var(--danger); font-size:1.3rem; cursor:pointer;">×</button>
            </div>`;
        c.appendChild(d);
    });
}

function toggleTaskCheck(id, currentStatus) { db.collection("tasks").doc(id).update({ completed: !currentStatus }); }
function deleteTask(id) { db.collection("tasks").doc(id).delete(); }
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if(task) {
        editingId = id;
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-time').value = task.time || "";
        document.getElementById('task-reminder').value = task.reminder || "none";
        document.getElementById('task-importance').value = task.importance;
        document.getElementById('modal-title').innerText = "Modifier la tâche";
        document.getElementById('task-modal').style.display = 'flex';
    }
}

document.getElementById('save-task').onclick = () => {
    const n = document.getElementById('task-name').value;
    const d = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;
    const rem = document.getElementById('task-reminder').value;
    const imp = document.getElementById('task-importance').value;
    
    if(n && d && currentUser) {
        let taskData = { name: n, date: d, time: time, reminder: rem, importance: imp };
        if(editingId) {
            db.collection("tasks").doc(editingId).update(taskData);
            editingId = null;
        } else {
            taskData.completed = false;
            taskData.userId = currentUser.uid;
            db.collection("tasks").add(taskData);
        }
        document.getElementById('task-modal').style.display = 'none';
    }
};

// --- ONGLET : CALENDRIER ---
function setViewState(s) { viewState = s; renderCalendar(); }
function renderCalendar() {
    const c = document.getElementById('calendar-content'); const t = document.getElementById('calendar-title'); c.innerHTML = '';
    if (!c) return;
    document.querySelectorAll('#calendar-page .bubble').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${viewState}`).classList.add('active');

    if (viewState === 'year') {
        c.className = 'grid-years'; t.innerText = "Années";
        for (let i = selectedYear - 4; i <= selectedYear + 4; i++) {
            const d = document.createElement('div'); d.className = `grid-item ${i === selectedYear ? 'selected' : ''}`;
            d.innerText = i; d.onclick = () => { selectedYear = i; setViewState('month'); }; c.appendChild(d);
        }
    } else if (viewState === 'month') {
        c.className = 'grid-months'; t.innerText = selectedYear;
        monthNames.forEach((n, i) => {
            const d = document.createElement('div'); d.className = `grid-item ${i === selectedMonth ? 'selected' : ''}`;
            d.innerText = n; d.onclick = () => { selectedMonth = i; setViewState('day'); }; c.appendChild(d);
        });
    } else {
        c.className = 'calendar-grid'; t.innerText = `${monthNames[selectedMonth]} ${selectedYear}`;
        const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        for (let i = 1; i <= days; i++) {
            const ds = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const div = document.createElement('div'); div.className = 'day-card';
            
            // Surbrillance Aujourd'hui
            if(ds === todayStr) div.classList.add('is-today');

            const dt = tasks.filter(tk => tk.date === ds);
            if(dt.length > 0) {
                const imps = dt.map(tk => tk.importance);
                if(imps.includes('high')) div.classList.add('has-high');
                else if(imps.includes('medium')) div.classList.add('has-medium');
                else div.classList.add('has-low');
            }
            
            // Ouverture Modal Customisé à la place de l'alert() moche
            div.onclick = () => openCalendarDayModal(i, monthNames[selectedMonth], selectedYear, dt);
            
            div.innerHTML = `<span style="font-size:0.6rem; opacity:0.5; display:block;">${dayInitials[new Date(selectedYear, selectedMonth, i).getDay()]}</span><b>${i}</b>`;
            c.appendChild(div);
        }
    }
}

// Fonction d'ouverture du modal de consultation calendrier esthétique
function openCalendarDayModal(day, monthName, year, dayTasks) {
    document.getElementById('cal-modal-date-title').innerText = `${day} ${monthName} ${year}`;
    const container = document.getElementById('cal-modal-tasks-container');
    container.innerHTML = '';

    if(dayTasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; opacity:0.5; font-style:italic;">Aucune tâche pour ce jour-ci</p>';
    } else {
        dayTasks.forEach(t => {
            container.innerHTML += `
                <div style="padding: 12px; border-radius: 12px; border-left: 6px solid var(--${t.importance === 'high'?'danger':t.importance==='medium'?'warning':'success'}); background: rgba(128,128,128,0.05);">
                    <strong style="${t.completed ? 'text-decoration:line-through; opacity:0.5;' : ''}">${t.name}</strong>
                    ${t.time ? `<span style="float:right; font-size:0.85rem; opacity:0.7;">⏰ ${t.time}</span>`:''}
                </div>`;
        });
    }
    document.getElementById('calendar-day-modal').style.display = 'flex';
}

// --- ONGLET : TO-DO LIST (GRAPHISMES ALIGNÉS SUR L'HEBDO & FIX MINUTES) ---
function setTodoMode(m) { todoMode = m; renderTodo(); }
function renderTodo() {
    const c = document.getElementById('todo-content'); if (!c) return;
    document.querySelectorAll('#todo-page .bubble').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${todoMode}`).classList.add('active');
    
    if(todoMode === 'daily') {
        document.getElementById('todo-today-date').innerText = new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
        c.innerHTML = '<div class="weekly-container"></div>'; // Utilise le container fluide type hebdo
        const wc = c.querySelector('.weekly-container');
        
        for (let h = 8; h <= 20; h++) {
            const currentHourStr = `${h.toString().padStart(2, '0')}:00`;
            
            // Correction Algorithme : On attrape TOUTES les minutes de l'heure h (ex: 08h10 ou 08h45 rentrent dans 08h00)
            let items = dailyTodo.filter(it => it.date === todayStr && parseInt(it.time.split(':')[0]) === h);
            let weeklyItems = weeklyTodo.filter(it => parseInt(it.dayOfWeek) === currentDayOfWeek && parseInt(it.time.split(':')[0]) === h);
            let combinedItems = [...items, ...weeklyItems];
            combinedItems.sort((a,b) => a.time.localeCompare(b.time));

            const hourCard = document.createElement('div');
            hourCard.className = 'weekly-day-card';
            hourCard.innerHTML = `
                <div class="weekly-day-header">
                    <span class="weekly-day-title">${currentHourStr}</span>
                    <button onclick="openTodoModal('${h.toString().padStart(2,'0')}:00', false)" style="background:var(--primary); border:none; color:white; border-radius:50%; width:25px; height:25px; font-weight:bold; cursor:pointer;">+</button>
                </div>
                <div class="weekly-subtasks">
                    ${combinedItems.map(it => {
                        const isWeekly = it.hasOwnProperty('dayOfWeek');
                        const checkFunc = isWeekly ? `toggleWeeklyTodo('${it.id}', ${it.completed})` : `toggleTodo('${it.id}', ${it.completed})`;
                        const delFunc = isWeekly ? `deleteWeeklyTodo('${it.id}')` : `deleteDailyTodo('${it.id}')`;
                        return `
                            <div class="weekly-item">
                                <span onclick="event.stopPropagation(); ${checkFunc}" style="cursor:pointer; ${it.completed ? 'text-decoration:line-through; opacity:0.5;' : ''}">
                                    <b>${it.time}</b> : ${it.name} ${isWeekly ? '<small style="opacity:0.5;">(Hebdo)</small>':''}
                                </span>
                                <div>
                                    <button onclick="editTodoItem('${it.id}', '${it.name}', '${it.time}', ${isWeekly}, ${isWeekly ? it.dayOfWeek : 0})" style="background:none; border:none; color:var(--primary); cursor:pointer; margin-right:5px;">✎</button>
                                    <button onclick="${delFunc}" style="background:none; border:none; color:var(--danger); cursor:pointer;">×</button>
                                </div>
                            </div>`;
                    }).join('') || '<span style="opacity:0.3; font-style:italic; font-size:0.85rem;">Aucun événement</span>'}
                </div>`;
            wc.appendChild(hourCard);
        }
    } else {
        // --- VUE HEBDO EXISTANTE ET PARFAITE ---
        document.getElementById('todo-today-date').innerText = "Planification Hebdomadaire";
        c.innerHTML = '<div class="weekly-container"></div>';
        const wc = c.querySelector('.weekly-container');
        const weeklyOrder = [1, 2, 3, 4, 5, 6, 0];
        
        weeklyOrder.forEach(dayNum => {
            const dayTasks = weeklyTodo.filter(it => parseInt(it.dayOfWeek) === dayNum);
            dayTasks.sort((a,b) => a.time.localeCompare(b.time));
            
            const dayCard = document.createElement('div');
            dayCard.className = 'weekly-day-card';
            dayCard.innerHTML = `
                <div class="weekly-day-header">
                    <span class="weekly-day-title">${dayNamesFr[dayNum]}</span>
                    <button onclick="openTodoModal('12:00', true, ${dayNum})" style="background:var(--primary); border:none; color:white; border-radius:50%; width:25px; height:25px; font-weight:bold; cursor:pointer;">+</button>
                </div>
                <div class="weekly-subtasks">
                    ${dayTasks.map(it => `
                        <div class="weekly-item">
                            <span onclick="toggleWeeklyTodo('${it.id}', ${it.completed})" style="cursor:pointer; ${it.completed ? 'text-decoration:line-through; opacity:0.5;' : ''}">
                                <b>${it.time}</b> : ${it.name}
                            </span>
                            <div>
                                <button onclick="editTodoItem('${it.id}', '${it.name}', '${it.time}', true, ${dayNum})" style="background:none; border:none; color:var(--primary); cursor:pointer; margin-right:5px;">✎</button>
                                <button onclick="deleteWeeklyTodo('${it.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;">×</button>
                            </div>
                        </div>
                    `).join('') || '<span style="opacity:0.3; font-style:italic; font-size:0.85rem;">Aucune activité planifiée</span>'}
                </div>`;
            wc.appendChild(dayCard);
        });
    }
}

function openTodoModal(time, isWeekly, dayNum = 1) { 
    editingTodoId = null;
    document.getElementById('todo-time').value = time;
    document.getElementById('todo-task-name').value = '';
    document.getElementById('todo-modal-title').innerText = "Ajouter au planning";
    const selector = document.getElementById('todo-day-selector-block');
    if(isWeekly) { selector.style.display = 'none'; document.getElementById('todo-day-select').value = dayNum; } 
    else { selector.style.display = 'none'; }
    document.getElementById('save-todo').setAttribute('data-weekly-mode', isWeekly);
    document.getElementById('todo-modal').style.display = 'flex'; 
}

function editTodoItem(id, name, time, isWeekly, dayNum = 1) {
    editingTodoId = id;
    document.getElementById('todo-time').value = time;
    document.getElementById('todo-task-name').value = name;
    document.getElementById('todo-modal-title').innerText = "Modifier le planning";
    const selector = document.getElementById('todo-day-selector-block');
    selector.style.display = 'none';
    if(isWeekly) document.getElementById('todo-day-select').value = dayNum;
    document.getElementById('save-todo').setAttribute('data-weekly-mode', isWeekly);
    document.getElementById('todo-modal').style.display = 'flex'; 
}

function toggleTodo(id, currentStatus) { db.collection("dailyTodo").doc(id).update({ completed: !currentStatus }); }
function toggleWeeklyTodo(id, currentStatus) { db.collection("weeklyTodo").doc(id).update({ completed: !currentStatus }); }
function deleteWeeklyTodo(id) { db.collection("weeklyTodo").doc(id).delete(); }
function deleteDailyTodo(id) { db.collection("dailyTodo").doc(id).delete(); }

document.getElementById('save-todo').onclick = () => {
    const n = document.getElementById('todo-task-name').value;
    const t = document.getElementById('todo-time').value;
    const isWeekly = document.getElementById('save-todo').getAttribute('data-weekly-mode') === 'true';
    
    if(n && t && currentUser) { 
        if(editingTodoId) {
            // Logique de modification
            let collection = isWeekly ? "weeklyTodo" : "dailyTodo";
            let updateData = { name: n, time: t };
            if(isWeekly) updateData.dayOfWeek = document.getElementById('todo-day-select').value;
            db.collection(collection).doc(editingTodoId).update(updateData);
            editingTodoId = null;
        } else {
            // Logique d'ajout
            if(isWeekly) {
                const daySelect = document.getElementById('todo-day-select').value;
                db.collection("weeklyTodo").add({ name: n, time: t, dayOfWeek: daySelect, completed: false, userId: currentUser.uid });
            } else {
                db.collection("dailyTodo").add({ name: n, time: t, date: todayStr, completed: false, userId: currentUser.uid }); 
            }
        }
        document.getElementById('todo-modal').style.display = 'none';
        document.getElementById('todo-task-name').value = '';
    }
};

// --- INITIALISATION GENERALE ---
document.getElementById('add-task-btn').onclick = () => { 
    editingId = null; 
    document.getElementById('task-name').value = ""; 
    document.getElementById('task-time').value = ""; 
    document.getElementById('task-reminder').value = "none"; 
    document.getElementById('task-date').value = todayStr; 
    document.getElementById('modal-title').innerText = "Nouvelle Tâche"; 
    document.getElementById('task-modal').style.display = 'flex'; 
};
document.getElementById('close-modal').onclick = () => document.getElementById('task-modal').style.display = 'none';
document.getElementById('close-todo-modal').onclick = () => document.getElementById('todo-modal').style.display = 'none';

window.onclick = (e) => { 
    if(e.target.className === 'modal') { 
        document.getElementById('task-modal').style.display = 'none'; 
        document.getElementById('todo-modal').style.display = 'none'; 
        document.getElementById('calendar-day-modal').style.display = 'none';
    } 
};
