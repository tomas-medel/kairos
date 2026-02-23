/* ========================================
   KAIROS — App Router & Init
   ======================================== */

let currentScreen = 'home';
let selectedDay = null;
let _swRegistration = null;
let _alarmTickInterval = null;
const _alarmTriggeredMap = {};

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
            .then(reg => {
                _swRegistration = reg;
                console.log('SW registered:', reg.scope);

                reg.addEventListener('updatefound', () => {
                    const installing = reg.installing;
                    if (!installing) return;

                    installing.addEventListener('statechange', () => {
                        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                            showModal(`
                              <h3>Actualización disponible</h3>
                              <p style="color:var(--text-secondary);margin-bottom:var(--space-md);">
                                Hay una nueva versión de Kairos disponible.
                              </p>
                              <button class="btn-primary" onclick="applyAppUpdate()">Actualizar ahora</button>
                              <button class="btn-secondary" onclick="closeModal()">Después</button>
                            `);
                        }
                    });
                });

                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (!window.__kairosReloadingForUpdate) {
                        window.__kairosReloadingForUpdate = true;
                        window.location.reload();
                    }
                });
            })
            .catch(err => console.log('SW registration failed:', err));
    }
}

function ensureReminderPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => { });
    }
}

function _playReminderTone() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.stop(ctx.currentTime + 0.38);
        setTimeout(() => ctx.close && ctx.close(), 500);
    } catch (e) { }
}

function _notifyReminder(activity, minutesBefore) {
    const title = minutesBefore > 0 ? '⏰ Recordatorio Kairos' : '⏰ Actividad comienza ahora';
    const body = minutesBefore > 0
        ? `${activity.nombre} empieza en ${minutesBefore} min (${activity.horaInicio})`
        : `${activity.nombre} comenzó (${activity.horaInicio})`;

    showToast(body);
    if (navigator.vibrate) navigator.vibrate([180, 100, 180]);
    _playReminderTone();

    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
        } catch (e) { }
    }
}

function checkActivityReminders() {
    const todayName = getDayName();
    const now = getCurrentTimeMinutes();
    const dateKey = todayStr();
    const activities = getActivities(todayName);

    activities.forEach(act => {
        if (!act || !act.reminderEnabled) return;
        const reminderMinutes = Math.max(0, parseInt(act.reminderMinutes || 0, 10) || 0);
        const start = timeToMinutes(act.horaInicio);
        const triggerMinute = Math.max(0, start - reminderMinutes);
        const alarmKey = `${dateKey}:${todayName}:${act.id}:${triggerMinute}`;

        if (now >= triggerMinute && now < triggerMinute + 1) {
            if (_alarmTriggeredMap[alarmKey]) return;
            _alarmTriggeredMap[alarmKey] = true;
            _notifyReminder(act, reminderMinutes);
        }
    });
}

function checkForAppUpdate() {
    if (!('serviceWorker' in navigator)) {
        showToast('Este dispositivo no soporta actualizaciones PWA');
        return;
    }

    const registrationPromise = _swRegistration
        ? Promise.resolve(_swRegistration)
        : navigator.serviceWorker.getRegistration();

    registrationPromise.then(reg => {
        if (!reg) {
            showToast('Service Worker no registrado');
            return;
        }

        _swRegistration = reg;

        if (reg.waiting) {
            applyAppUpdate();
            return;
        }

        reg.update()
            .then(() => {
                setTimeout(() => {
                    if (reg.waiting) {
                        applyAppUpdate();
                    } else {
                        showToast('Ya tienes la versión más reciente');
                    }
                }, 800);
            })
            .catch(() => showToast('No se pudo buscar actualizaciones'));
    });
}

function applyAppUpdate() {
    const reg = _swRegistration;
    closeModal();

    if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        showToast('Actualizando aplicación...');
        return;
    }

    window.location.reload();
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

function startReminderLoop() {
    if (_alarmTickInterval) clearInterval(_alarmTickInterval);
    checkActivityReminders();
    _alarmTickInterval = setInterval(checkActivityReminders, 15000);
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
    startReminderLoop();

    // PWA install prompt
    initInstallPrompt();
    ensureReminderPermission();
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

