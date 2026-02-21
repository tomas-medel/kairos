/* ========================================
   KAIROS — App Router & Init
   ======================================== */

let currentScreen = 'home';
let selectedDay = null;

/* ========================================
   Router
   ======================================== */
function navigate(screen) {
    currentScreen = screen;

    // Show/hide header and day selector based on screen
    const header = document.querySelector('.app-header');
    const daySelector = document.querySelector('.day-selector');

    if (screen === 'analisis' || screen === 'ajustes') {
        header.classList.add('hidden');
        daySelector.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
        daySelector.classList.remove('hidden');
    }

    // Update bottom nav active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === screen);
    });

    // Render content
    const mainContent = document.getElementById('main-content');
    mainContent.style.animation = 'none';
    mainContent.offsetHeight; // trigger reflow
    mainContent.style.animation = 'fadeIn 0.3s ease';

    switch (screen) {
        case 'home':
            renderHome(selectedDay);
            break;
        case 'tienda':
            renderTienda();
            break;
        case 'misiones':
            renderMisiones();
            break;
        case 'analisis':
            renderAnalisis();
            break;
        case 'ajustes':
            renderAjustes();
            break;
    }

    updateHeaderPoints();
    updateMissionsBadge();
}

function goBack() {
    navigate('home');
}

/* ========================================
   Header Points
   ======================================== */
function updateHeaderPoints() {
    const el = document.getElementById('header-pts');
    if (el) {
        const pts = getPoints();
        el.textContent = pts.toLocaleString();
    }
}

/* ========================================
   Day Selector Events
   ======================================== */
function initDaySelector() {
    const today = getDayName();
    selectedDay = today;

    document.querySelectorAll('.day-btn').forEach(btn => {
        const day = btn.dataset.day;

        // Mark today
        if (day === today) {
            btn.classList.add('today', 'active');
        }

        btn.addEventListener('click', () => {
            selectedDay = day;
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (currentScreen === 'home') {
                renderHome(selectedDay);
            }
        });
    });
}

/* ========================================
   Bottom Nav Events
   ======================================== */
function initBottomNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigate(btn.dataset.screen);
        });
    });
}

/* ========================================
   Header Button Events
   ======================================== */
function initHeaderButtons() {
    document.getElementById('btn-analisis').addEventListener('click', () => {
        navigate('analisis');
    });

    document.getElementById('btn-ajustes').addEventListener('click', () => {
        navigate('ajustes');
    });
}

/* ========================================
   Modal System
   ======================================== */
let _selectedEmoji = null;

function showModal(html) {
    _selectedEmoji = null;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-content">${html}</div>`;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.style.animation = 'fadeIn 0.2s ease reverse';
        setTimeout(() => overlay.remove(), 150);
    }
}

function renderEmojiGrid(containerId, emojis) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = emojis.map(e =>
        `<button type="button" class="emoji-option" onclick="selectEmoji(this, '${e}')">${e}</button>`
    ).join('');
}

function selectEmoji(el, emoji) {
    document.querySelectorAll('.emoji-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    _selectedEmoji = emoji;
}

function getSelectedEmoji() {
    return _selectedEmoji;
}

/* ========================================
   Toast Notifications
   ======================================== */
function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}

/* ========================================
   Points Pop Animation
   ======================================== */
function showPointsPop(isPositive) {
    const data = getData();
    const pop = document.createElement('div');
    pop.className = `points-pop ${isPositive ? 'positive' : 'negative'}`;
    pop.textContent = isPositive ? '+✓' : '−';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

/* ========================================
   Service Worker Registration
   ======================================== */
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.log('SW registration failed:', err));
    }
}

/* ========================================
   Auto-refresh current activity
   ======================================== */
function startAutoRefresh() {
    // Refresh home every minute to update current activity
    setInterval(() => {
        if (currentScreen === 'home') {
            renderHome(selectedDay);
        }
    }, 60000);
}

/* ========================================
   PWA Install Prompt
   ======================================== */
let deferredPrompt = null;

function initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        hideInstallBanner();
        showToast('¡Kairos instalado! 🎉');
    });
}

function showInstallBanner() {
    if (document.getElementById('install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.innerHTML = `
    <div class="install-banner">
      <div class="install-info">
        <strong>📲 Instalar Kairos</strong>
        <span>Acceso rápido desde tu pantalla</span>
      </div>
      <button class="btn-install" onclick="installApp()">Instalar</button>
      <button class="btn-install-close" onclick="hideInstallBanner()">✕</button>
    </div>
  `;
    document.body.appendChild(banner);
}

function hideInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) banner.remove();
}

async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
        showToast('¡Instalando Kairos! 🚀');
    }
    deferredPrompt = null;
    hideInstallBanner();
}

/* ========================================
   Init
   ======================================== */
function init() {
    // Initialize data
    getData();

    // Setup UI
    initDaySelector();
    initBottomNav();
    initHeaderButtons();

    // Render home
    navigate('home');

    // Register service worker
    registerSW();

    // Auto-refresh
    startAutoRefresh();

    // PWA install prompt
    initInstallPrompt();
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

