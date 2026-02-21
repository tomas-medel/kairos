/* ========================================
   KAIROS — Ajustes (Settings) Screen
   ======================================== */

let _settingsTab = 'calendario';
let _settingsDay = null;

function renderAjustes() {
    const container = document.getElementById('main-content');

    // Hide main header/day selector
    document.querySelector('.app-header').classList.add('hidden');
    document.querySelector('.day-selector').classList.add('hidden');

    if (!_settingsDay) _settingsDay = getDayName();

    let html = `
    <div class="sub-header">
      <button class="btn-back" onclick="goBack()">←</button>
      <h1>Ajustes</h1>
    </div>
    <div class="settings-tabs">
      <button class="settings-tab ${_settingsTab === 'calendario' ? 'active' : ''}" onclick="setSettingsTab('calendario')">Calendario</button>
      <button class="settings-tab ${_settingsTab === 'tienda' ? 'active' : ''}" onclick="setSettingsTab('tienda')">Tienda</button>
      <button class="settings-tab ${_settingsTab === 'misiones' ? 'active' : ''}" onclick="setSettingsTab('misiones')">Misiones</button>
    </div>
  `;

    if (_settingsTab === 'calendario') {
        html += renderSettingsCalendar();
    } else if (_settingsTab === 'tienda') {
        html += renderSettingsShop();
    } else {
        html += renderSettingsMissions();
    }

    container.innerHTML = html;
}

function setSettingsTab(tab) {
    _settingsTab = tab;
    renderAjustes();
}

/* ========================================
   Settings — Calendar
   ======================================== */
function renderSettingsCalendar() {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const dayIdx = days.indexOf(_settingsDay);
    const activities = getActivities(_settingsDay);

    let html = `
    <div class="settings-day-nav">
      <button onclick="settingsPrevDay()">‹</button>
      <span class="day-label">📅 ${getDayLabel(_settingsDay)}</span>
      <button onclick="settingsNextDay()">›</button>
    </div>
  `;

    if (activities.length === 0) {
        html += `
      <div style="text-align: center; padding: var(--space-lg); color: var(--text-secondary);">
        <p>No hay actividades para este día</p>
      </div>
    `;
    }

    activities.forEach((act, i) => {
        html += `
      <div class="settings-item" style="animation: slideUp 0.3s ease ${i * 0.05}s backwards">
        <span class="item-emoji">${act.emoji || '📌'}</span>
        <div class="item-info">
          <div class="item-name">${act.nombre}</div>
          <div class="item-detail">${act.horaInicio} - ${act.horaFin}</div>
        </div>
        ${act.recurrente ? '<span class="item-badge">Recurrente</span>' : ''}
        <button class="btn-delete" onclick="handleDeleteActivity('${_settingsDay}', '${act.id}')">🗑️</button>
      </div>
    `;
    });

    html += `
    <button class="btn-add" onclick="openActivityModal()">
      + Agregar actividad
    </button>
  `;

    return html;
}

function settingsPrevDay() {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const idx = days.indexOf(_settingsDay);
    _settingsDay = days[(idx - 1 + 7) % 7];
    renderAjustes();
}

function settingsNextDay() {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const idx = days.indexOf(_settingsDay);
    _settingsDay = days[(idx + 1) % 7];
    renderAjustes();
}

function handleDeleteActivity(day, id) {
    deleteActivity(day, id);
    renderAjustes();
    showToast('Actividad eliminada');
}

function openActivityModal() {
    showModal(`
    <h3>Nueva Actividad</h3>
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" class="form-input" id="modal-name" placeholder="Ej: Estudiar Ciberseguridad">
    </div>
    <div class="form-group">
      <label>Emoji</label>
      <div class="emoji-grid" id="modal-emoji-grid"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Inicio</label>
        <input type="time" class="form-input" id="modal-start" value="08:00">
      </div>
      <div class="form-group">
        <label>Fin</label>
        <input type="time" class="form-input" id="modal-end" value="09:00">
      </div>
    </div>
    <div class="toggle-row">
      <span class="toggle-label">Recurrente</span>
      <div class="toggle-switch" id="modal-recurrente" onclick="this.classList.toggle('active')"></div>
    </div>
    <button class="btn-primary" onclick="saveActivity()">Guardar</button>
    <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
  `);

    renderEmojiGrid('modal-emoji-grid', DEFAULT_EMOJIS.slice(0, 12));
}

function saveActivity() {
    const nombre = document.getElementById('modal-name').value.trim();
    const horaInicio = document.getElementById('modal-start').value;
    const horaFin = document.getElementById('modal-end').value;
    const recurrente = document.getElementById('modal-recurrente').classList.contains('active');
    const emoji = getSelectedEmoji() || '📌';

    if (!nombre || !horaInicio || !horaFin) {
        showToast('Completa todos los campos');
        return;
    }

    if (timeToMinutes(horaFin) <= timeToMinutes(horaInicio)) {
        showToast('La hora de fin debe ser después del inicio');
        return;
    }

    addActivity(_settingsDay, { nombre, emoji, horaInicio, horaFin, recurrente });
    closeModal();
    renderAjustes();
    showToast('Actividad agregada ✨');
}

/* ========================================
   Settings — Shop
   ======================================== */
function renderSettingsShop() {
    const items = getShopItems();

    let html = '';

    if (items.length === 0) {
        html += `
      <div style="text-align: center; padding: var(--space-lg); color: var(--text-secondary);">
        <p>No hay recompensas configuradas</p>
      </div>
    `;
    }

    items.forEach((item, i) => {
        html += `
      <div class="settings-item" style="animation: slideUp 0.3s ease ${i * 0.05}s backwards">
        <span class="item-emoji">${item.emoji || '🎁'}</span>
        <div class="item-info">
          <div class="item-name">${item.nombre}</div>
          <div class="item-detail">${item.precio} pts</div>
        </div>
        <button class="btn-delete" onclick="handleDeleteShopItem('${item.id}')">🗑️</button>
      </div>
    `;
    });

    html += `
    <button class="btn-add" onclick="openShopModal()">
      + Agregar recompensa
    </button>
  `;

    return html;
}

function handleDeleteShopItem(id) {
    deleteShopItem(id);
    renderAjustes();
    showToast('Recompensa eliminada');
}

/* ========================================
   Settings — Missions
   ======================================== */
function renderSettingsMissions() {
    const missions = getMissions();

    let html = '';

    if (missions.length === 0) {
        html += `
      <div style="text-align: center; padding: var(--space-lg); color: var(--text-secondary);">
        <p>No hay misiones configuradas</p>
      </div>
    `;
    }

    missions.forEach((m, i) => {
        html += `
      <div class="settings-item" style="animation: slideUp 0.3s ease ${i * 0.05}s backwards">
        <span class="item-emoji">${m.emoji || '⭐'}</span>
        <div class="item-info">
          <div class="item-name">${m.nombre}</div>
          <div class="item-detail">${m.tipo === 'positiva' ? 'Positiva' : 'Negativa'} · Meta: ${m.meta || 1}</div>
        </div>
        <span class="item-points" style="color: ${m.puntos >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${m.puntos >= 0 ? '+' : ''}${m.puntos} pts
        </span>
        <button class="btn-delete" onclick="handleDeleteMission('${m.id}')">🗑️</button>
      </div>
    `;
    });

    html += `
    <button class="btn-add" onclick="openMissionModal()">
      + Agregar misión
    </button>
  `;

    return html;
}

function handleDeleteMission(id) {
    deleteMission(id);
    renderAjustes();
    showToast('Misión eliminada');
}
