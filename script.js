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
let userNickname = ""; 
let hasShownWelcomeThisSession = false; 
let taskSubView = "active"; 
let unsubscribeTasks, unsubscribeDaily, unsubscribeWeekly; 

let currentTheme = localStorage.getItem('listme_theme') || 'pink';
let viewState = 'day'; 
let todoMode = 'daily';
let editingId = null;
let editingTodoId = null; 
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const dayInitials = ["D", "L", "M", "M", "J", "V", "S"];
const dayNamesFr = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const todayStr = new Date().toISOString().split('T')[0];
const currentDayOfWeek = new Date().getDay();

document.body.className = `theme-${currentTheme}`;

// --- BULLE DE NOTIFICATION TOAST ---
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.innerText = message;
    toast.className = "toast-show";
    setTimeout(() => { toast.className = "toast-hidden"; }, 3000);
}

function changeTheme(t) { 
    document.body.className = `theme-${t}`; 
    localStorage.setItem('listme_theme', t); 
}

function showPage(p) {
    document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`${p}-page`);
    if (target) target.style.display = 'block';
    
    document.querySelectorAll('.nav-bubble').forEach(btn => btn.classList.remove('active'));
    const currentNavBtn = document.getElementById(`nav-btn-${p}`);
    if (currentNavBtn) currentNavBtn.classList.add('active');
    
    if(p === 'calendar') renderCalendar();
    if(p === 'todo') renderTodo();
    if(p === 'tasks') renderTasks();
}

function switchTaskSubView(view) {
    taskSubView = view;
    document.querySelectorAll('.sub-menu-tab').forEach(b => b.classList.remove('active'));
    const actionBar = document.getElementById('tasks-action-bar');
    if(view === 'active') {
        document.getElementById('sub-btn-active-tasks').classList.add('active');
        if(actionBar) actionBar.style.display = 'flex';
    } else {
        document.getElementById('sub-btn-archived-tasks').classList.add('active');
        if(actionBar) actionBar.style.display = 'none';
    }
    renderTasks();
}

// --- MOTEUR DE VÉRIFICATION EN CONTINU ---
function runNotificationEngine() {
    const now = new Date();
    if(document.getElementById('tasks-page').style.display === 'block') { renderTasks(); }

    const todayString = now.toISOString().split('T')[0];
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay();

    if (dayOfWeek === 0 && hour === 18 && minute === 0) {
        const key = `recap-${todayString}`;
        let heavyNotificationsSent = JSON.parse(localStorage.getItem('listme_sent_notifs')) || {};
        if (!heavyNotificationsSent[key]) {
            const activeTasksCount = tasks.filter(t => !t.completed).length;
            sendNotification("📋 LIST'ME : Récap de ta semaine", activeTasksCount > 0 ? `Tu as ${activeTasksCount} tâches prévues cette semaine.` : "Aucune tâche critique de planifiée.");
            heavyNotificationsSent[key] = true;
            localStorage.setItem('listme_sent_notifs', JSON.stringify(heavyNotificationsSent));
        }
    }

    tasks.forEach(t => {
        if (t.completed || !t.date) return;
        const taskDateObj = new Date(t.date);
        const diffTime = taskDateObj - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1 && hour === 20 && minute === 0) {
            const key = `veille-${t.id}`;
            let heavyNotificationsSent = JSON.parse(localStorage.getItem('listme_sent_notifs')) || {};
            if (!heavyNotificationsSent[key]) {
                sendNotification("⏰ Rappel : C'est pour demain !", `Ne pas oublier : "${t.name}" prévu demain.`);
                heavyNotificationsSent[key] = true;
                localStorage.setItem('listme_sent_notifs', JSON.stringify(heavyNotificationsSent));
            }
        }

        if (t.time && t.reminders && t.reminders.length > 0) {
            const [tHour, tMin] = t.time.split(':').map(Number
