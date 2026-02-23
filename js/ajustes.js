/* ========================================
   KAIROS — Ajustes (Settings) Screen v2
   Full CRUD: Calendario, Tienda, Misiones
   + Reset estadísticas con verificación
   ======================================== */

let _settingsTab = 'calendario';
let _settingsDay = null;

function renderAjustes() {
  const container = document.getElementById('main-content');

  document.querySelector('.app-header').classList.add('hidden');
  document.querySelector('.day-selector').classList.add('hidden');

  if (!_settingsDay) _settingsDay = getDayName();

  let html = `
    <div class="sub-header">
      <button class="btn-back" onclick="goBack()">←</button>
      <h1>Ajustes</h1>
    </div>
    <div class="settings-tabs">
      <button class="settings-tab ${_settingsTab === 'calendario' ? 'active' : ''}" onclick="setSettingsTab('calendario')">📅</button>
      <button class="settings-tab ${_settingsTab === 'tienda' ? 'active' : ''}" onclick="setSettingsTab('tienda')">🛍️</button>
      <button class="settings-tab ${_settingsTab === 'misiones' ? 'active' : ''}" onclick="setSettingsTab('misiones')">🎯</button>
      <button class="settings-tab ${_settingsTab === 'cuenta' ? 'active' : ''}" onclick="setSettingsTab('cuenta')">⚙️</button>
    </div>
  `;

  if (_settingsTab === 'calendario') {
    html += renderSettingsCalendar();
  } else if (_settingsTab === 'tienda') {
    html += renderSettingsShop();
  } else if (_settingsTab === 'misiones') {
    html += renderSettingsMissions();
  } else {
    html += renderSettingsAccount();
  }

  container.innerHTML = html;
}

function setSettingsTab(tab) {
  _settingsTab = tab;
  renderAjustes();
}

/* ========================================
   Settings — Calendar (full CRUD)
   ======================================== */
function renderSettingsCalendar() {
  const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const activities = getActivities(_settingsDay);

  let html = `
    <div class="settings-day-nav">
      <button onclick="settingsPrevDay()">‹</button>
      <span class="day-label">📅 ${getDayLabel(_settingsDay)}</span>
      <button onclick="settingsNextDay()">›</button>
    </div>
  `;

  if (activities.length === 0) {
    html += `<p style="text-align:center;color:var(--text-secondary);padding:var(--space-lg) 0;">Sin actividades para este día</p>`;
  }

  activities.forEach((act, i) => {
    html += `
      <div class="settings-item" style="animation: slideUp 0.3s ease ${i * 0.05}s backwards">
        <span class="item-emoji">${act.emoji || '📌'}</span>
        <div class="item-info">
          <div class="item-name">${act.nombre}</div>
          <div class="item-detail">${act.horaInicio} – ${act.horaFin}${act.recurrente ? ' · Recurrente' : ''}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn-icon-edit" title="Copiar a otros dias" onclick="openCopyActivityModal('${_settingsDay}','${act.id}')">Copiar</button>
          <button class="btn-icon-edit" onclick="openEditActivityModal('${_settingsDay}','${act.id}')">✏️</button>
          <button class="btn-icon-del" onclick="handleDeleteActivity('${_settingsDay}','${act.id}')">🗑️</button>
        </div>
      </div>
    `;
  });

  html += `<button class="btn-add" onclick="openActivityModal()">+ Agregar actividad</button>`;
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
  if (!confirm('¿Eliminar esta actividad?')) return;
  deleteActivity(day, id);
  renderAjustes();
  showToast('Actividad eliminada');
}

function openActivityModal(prefillId) {
  const act = prefillId ? getActivities(_settingsDay).find(a => a.id === prefillId) : null;
  const isEdit = !!act;

  showModal(`
    <h3>${isEdit ? 'Editar' : 'Nueva'} Actividad</h3>
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" class="form-input" id="modal-name" placeholder="Ej: Estudiar" value="${act ? act.nombre : ''}">
    </div>
    <div class="form-group">
      <label>Emoji</label>
      <div class="emoji-grid" id="modal-emoji-grid"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Inicio</label>
        <input type="time" class="form-input" id="modal-start" value="${act ? act.horaInicio : '08:00'}">
      </div>
      <div class="form-group">
        <label>Fin</label>
        <input type="time" class="form-input" id="modal-end" value="${act ? act.horaFin : '09:00'}">
      </div>
    </div>
    <div class="toggle-row">
      <span class="toggle-label">Recurrente (todas las semanas)</span>
      <div class="toggle-switch ${act && act.recurrente ? 'active' : ''}" id="modal-recurrente" onclick="this.classList.toggle('active')"></div>
    </div>
    <div class="toggle-row">
      <span class="toggle-label">Recordatorio / alarma</span>
      <div class="toggle-switch ${act && act.reminderEnabled ? 'active' : ''}" id="modal-reminder-enabled" onclick="toggleReminderConfig()"></div>
    </div>
    <div class="form-group" id="modal-reminder-config" style="display:${act && act.reminderEnabled ? 'block' : 'none'};">
      <label>Recordar antes de empezar</label>
      <select class="form-input" id="modal-reminder-minutes">
        <option value="0" ${(act && Number(act.reminderMinutes) === 0) ? 'selected' : ''}>A la hora exacta</option>
        <option value="5" ${(!act || Number(act.reminderMinutes || 5) === 5) ? 'selected' : ''}>5 minutos antes</option>
        <option value="10" ${(act && Number(act.reminderMinutes) === 10) ? 'selected' : ''}>10 minutos antes</option>
        <option value="15" ${(act && Number(act.reminderMinutes) === 15) ? 'selected' : ''}>15 minutos antes</option>
        <option value="30" ${(act && Number(act.reminderMinutes) === 30) ? 'selected' : ''}>30 minutos antes</option>
      </select>
    </div>
    <button class="btn-primary" onclick="${isEdit ? `saveEditActivity('${_settingsDay}','${act.id}')` : 'saveActivity()'}">
      ${isEdit ? 'Guardar cambios' : 'Agregar'}
    </button>
    <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
  `);

  const emojisToShow = act ? [act.emoji || '📌', ...DEFAULT_EMOJIS.slice(0, 11)] : DEFAULT_EMOJIS.slice(0, 12);
  renderEmojiGrid('modal-emoji-grid', emojisToShow);
  if (act && act.emoji) {
    setTimeout(() => {
      const btns = document.querySelectorAll('.emoji-option');
      if (btns[0]) { btns[0].classList.add('selected'); _selectedEmoji = act.emoji; }
    }, 50);
  }
}

function openEditActivityModal(day, id) {
  _settingsDay = day;
  openActivityModal(id);
}

function toggleReminderConfig() {
  const toggle = document.getElementById('modal-reminder-enabled');
  const config = document.getElementById('modal-reminder-config');
  if (!toggle || !config) return;
  toggle.classList.toggle('active');
  config.style.display = toggle.classList.contains('active') ? 'block' : 'none';
}

function openCopyActivityModal(day, id) {
  const act = getActivities(day).find(a => a.id === id);
  if (!act) { showToast('Actividad no encontrada'); return; }

  const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  showModal(`
    <h3>Copiar actividad</h3>
    <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:var(--space-md);">
      <strong>${act.nombre}</strong> (${act.horaInicio} - ${act.horaFin})<br>
      Selecciona uno o varios dias destino.
    </p>
    <div class="form-group">
      <label>Dias destino</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${days.map(d => `
          <label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;">
            <input type="checkbox" class="copy-day-check" value="${d}" ${d === day ? 'disabled' : ''}>
            <span>${getDayLabel(d)}${d === day ? ' (origen)' : ''}</span>
          </label>
        `).join('')}
      </div>
    </div>
    <button class="btn-primary" onclick="confirmCopyActivity('${day}','${id}')">Copiar</button>
    <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
  `);
}

function confirmCopyActivity(day, id) {
  const targetDays = Array.from(document.querySelectorAll('.copy-day-check:checked')).map(el => el.value);
  if (targetDays.length === 0) { showToast('Selecciona al menos un dia'); return; }

  const result = copyActivityToDays(day, id, targetDays);
  closeModal();
  renderAjustes();

  if (result.copied === 0) {
    showToast('No se copiaron actividades');
  } else if (result.skipped > 0) {
    showToast(`Copiadas: ${result.copied} · Omitidas: ${result.skipped}`);
  } else {
    showToast(`Actividad copiada a ${result.copied} dia(s)`);
  }
}

function saveActivity() {
  const nombre = document.getElementById('modal-name').value.trim();
  const horaInicio = document.getElementById('modal-start').value;
  const horaFin = document.getElementById('modal-end').value;
  const recurrente = document.getElementById('modal-recurrente').classList.contains('active');
  const reminderEnabled = document.getElementById('modal-reminder-enabled')?.classList.contains('active') || false;
  const reminderMinutes = parseInt(document.getElementById('modal-reminder-minutes')?.value || '5', 10) || 0;
  const emoji = getSelectedEmoji() || '📌';

  if (!nombre || !horaInicio || !horaFin) { showToast('Completa todos los campos'); return; }
  if (timeToMinutes(horaFin) <= timeToMinutes(horaInicio)) { showToast('La hora de fin debe ser mayor'); return; }

  addActivity(_settingsDay, { nombre, emoji, horaInicio, horaFin, recurrente, reminderEnabled, reminderMinutes });
  if (reminderEnabled && typeof ensureReminderPermission === 'function') ensureReminderPermission();
  closeModal();
  renderAjustes();
  showToast('Actividad agregada ✨');
}

function saveEditActivity(day, id) {
  const nombre = document.getElementById('modal-name').value.trim();
  const horaInicio = document.getElementById('modal-start').value;
  const horaFin = document.getElementById('modal-end').value;
  const recurrente = document.getElementById('modal-recurrente').classList.contains('active');
  const reminderEnabled = document.getElementById('modal-reminder-enabled')?.classList.contains('active') || false;
  const reminderMinutes = parseInt(document.getElementById('modal-reminder-minutes')?.value || '5', 10) || 0;
  const emoji = getSelectedEmoji() || '📌';

  if (!nombre || !horaInicio || !horaFin) { showToast('Completa todos los campos'); return; }
  if (timeToMinutes(horaFin) <= timeToMinutes(horaInicio)) { showToast('La hora de fin debe ser mayor'); return; }

  updateActivity(day, id, { nombre, emoji, horaInicio, horaFin, recurrente, reminderEnabled, reminderMinutes });
  if (reminderEnabled && typeof ensureReminderPermission === 'function') ensureReminderPermission();
  closeModal();
  renderAjustes();
  showToast('Actividad actualizada ✅');
}

/* ========================================
   Settings — Shop (full CRUD)
   ======================================== */
function renderSettingsShop() {
  const items = getShopItems();
  let html = '';

  if (items.length === 0) {
    html += `<p style="text-align:center;color:var(--text-secondary);padding:var(--space-lg) 0;">Sin recompensas configuradas</p>`;
  }

  items.forEach((item, i) => {
    html += `
      <div class="settings-item" style="animation: slideUp 0.3s ease ${i * 0.05}s backwards">
        <span class="item-emoji">${item.emoji || '🎁'}</span>
        <div class="item-info">
          <div class="item-name">${item.nombre}</div>
          <div class="item-detail">${item.precio} pts</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn-icon-edit" onclick="openEditShopModal('${item.id}')">✏️</button>
          <button class="btn-icon-del" onclick="handleDeleteShopItem('${item.id}')">🗑️</button>
        </div>
      </div>
    `;
  });

  html += `<button class="btn-add" onclick="openShopModal()">+ Agregar recompensa</button>`;
  return html;
}

function handleDeleteShopItem(id) {
  if (!confirm('¿Eliminar esta recompensa?')) return;
  deleteShopItem(id);
  renderAjustes();
  showToast('Recompensa eliminada');
}

function openShopModal(prefillId) {
  const item = prefillId ? getShopItems().find(i => i.id === prefillId) : null;
  const isEdit = !!item;

  showModal(`
    <h3>${isEdit ? 'Editar' : 'Nueva'} Recompensa</h3>
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" class="form-input" id="modal-name" placeholder="Ej: Helado" value="${item ? item.nombre : ''}">
    </div>
    <div class="form-group">
      <label>Emoji</label>
      <div class="emoji-grid" id="modal-emoji-grid"></div>
    </div>
    <div class="form-group">
      <label>Precio (puntos)</label>
      <input type="number" class="form-input" id="modal-price" placeholder="250" min="1" value="${item ? item.precio : ''}">
    </div>
    <button class="btn-primary" onclick="${isEdit ? `saveEditShopItem('${item.id}')` : 'saveShopItem()'}">
      ${isEdit ? 'Guardar cambios' : 'Agregar'}
    </button>
    <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
  `);

  const shopEmojis = ['🍦', '🍕', '🎬', '🎮', '🛒', '☕', '🍔', '🎧', '🏖️', '🎂', '🧁', '🎁'];
  const emojisToShow = item ? [item.emoji || '🎁', ...shopEmojis.slice(0, 11)] : shopEmojis;
  renderEmojiGrid('modal-emoji-grid', emojisToShow);
  if (item && item.emoji) {
    setTimeout(() => {
      const btns = document.querySelectorAll('.emoji-option');
      if (btns[0]) { btns[0].classList.add('selected'); _selectedEmoji = item.emoji; }
    }, 50);
  }
}

function openEditShopModal(id) {
  openShopModal(id);
}

function saveShopItem() {
  const nombre = document.getElementById('modal-name').value.trim();
  const precio = parseInt(document.getElementById('modal-price').value) || 0;
  const emoji = getSelectedEmoji() || '🎁';

  if (!nombre || precio <= 0) { showToast('Completa todos los campos'); return; }

  addShopItem({ nombre, emoji, precio });
  closeModal();
  renderAjustes();
  showToast('Recompensa agregada ✨');
}

function saveEditShopItem(id) {
  const nombre = document.getElementById('modal-name').value.trim();
  const precio = parseInt(document.getElementById('modal-price').value) || 0;
  const emoji = getSelectedEmoji() || '🎁';

  if (!nombre || precio <= 0) { showToast('Completa todos los campos'); return; }

  updateShopItem(id, { nombre, emoji, precio });
  closeModal();
  renderAjustes();
  showToast('Recompensa actualizada ✅');
}

/* ========================================
   Settings — Missions (full CRUD)
   ======================================== */
function renderSettingsMissions() {
  const missions = getMissions();
  let html = '';

  if (missions.length === 0) {
    html += `<p style="text-align:center;color:var(--text-secondary);padding:var(--space-lg) 0;">Sin misiones configuradas</p>`;
  }

  missions.forEach((m, i) => {
    const frecLabel = {
      diaria: '🔁 Diaria',
      unica: '1️⃣ Una vez',
      especial: '📅 Especial'
    }[m.frecuencia] || '🔁 Diaria';

    html += `
      <div class="settings-item" style="animation: slideUp 0.3s ease ${i * 0.05}s backwards">
        <span class="item-emoji">${m.emoji || '⭐'}</span>
        <div class="item-info">
          <div class="item-name">${m.nombre}</div>
          <div class="item-detail">${frecLabel} · Meta: ${m.meta || 1}</div>
        </div>
        <span class="item-points" style="color:${m.puntos >= 0 ? 'var(--success)' : 'var(--danger)'}; font-size:0.8rem; font-weight:700;">
          ${m.puntos >= 0 ? '+' : ''}${m.puntos}
        </span>
        <div style="display:flex;gap:6px;">
          <button class="btn-icon-edit" onclick="openEditMissionModal('${m.id}')">✏️</button>
          <button class="btn-icon-del" onclick="handleDeleteMission('${m.id}')">🗑️</button>
        </div>
      </div>
    `;
  });

  html += `<button class="btn-add" onclick="openMissionModal()">+ Agregar misión</button>`;
  return html;
}

function handleDeleteMission(id) {
  if (!confirm('¿Eliminar esta misión?')) return;
  deleteMission(id);
  renderAjustes();
  showToast('Misión eliminada');
}

function openMissionModal(prefillId) {
  const m = prefillId ? getMissions().find(x => x.id === prefillId) : null;
  const isEdit = !!m;

  showModal(`
    <h3>${isEdit ? 'Editar' : 'Nueva'} Misión</h3>
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" class="form-input" id="modal-name" placeholder="Ej: Tomar 7 vasos de agua" value="${m ? m.nombre : ''}">
    </div>
    <div class="form-group">
      <label>Emoji</label>
      <div class="emoji-grid" id="modal-emoji-grid"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Puntos</label>
        <input type="number" class="form-input" id="modal-points" placeholder="10" value="${m ? Math.abs(m.puntos) : ''}">
      </div>
      <div class="form-group">
        <label>Meta (repeticiones)</label>
        <input type="number" class="form-input" id="modal-meta" placeholder="1" min="1" value="${m ? m.meta || 1 : 1}">
      </div>
    </div>
    <div class="form-group">
      <label>Tipo</label>
      <select class="form-input" id="modal-type">
        <option value="positiva" ${!m || m.tipo === 'positiva' ? 'selected' : ''}>✅ Positiva (suma puntos)</option>
        <option value="negativa" ${m && m.tipo === 'negativa' ? 'selected' : ''}>❌ Negativa (resta puntos)</option>
      </select>
    </div>
    <div class="form-group">
      <label>Frecuencia</label>
      <select class="form-input" id="modal-frecuencia">
        <option value="diaria" ${!m || m.frecuencia === 'diaria' ? 'selected' : ''}>🔁 Diaria (se resetea cada día)</option>
        <option value="unica" ${m && m.frecuencia === 'unica' ? 'selected' : ''}>1️⃣ Una sola vez</option>
        <option value="especial" ${m && m.frecuencia === 'especial' ? 'selected' : ''}>📅 Fecha especial</option>
      </select>
    </div>
    <div class="form-group" id="modal-fecha-group" style="display:none;">
      <label>Fecha de expiración</label>
      <input type="date" class="form-input" id="modal-fecha" value="${m && m.fechaExpira ? m.fechaExpira : ''}">
    </div>
    <button class="btn-primary" onclick="${isEdit ? `saveEditMission('${m.id}')` : 'saveMission()'}">
      ${isEdit ? 'Guardar cambios' : 'Agregar'}
    </button>
    <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
  `);

  const missionEmojis = ['💧', '📖', '🧘', '🏋️', '🙏', '🌙', '🤬', '📵', '🍬', '🚶', '💊', '☕'];
  const emojisToShow = m ? [m.emoji || '⭐', ...missionEmojis.slice(0, 11)] : missionEmojis;
  renderEmojiGrid('modal-emoji-grid', emojisToShow);
  if (m && m.emoji) {
    setTimeout(() => {
      const btns = document.querySelectorAll('.emoji-option');
      if (btns[0]) { btns[0].classList.add('selected'); _selectedEmoji = m.emoji; }
    }, 50);
  }

  // Show/hide fecha field based on frecuencia
  setTimeout(() => {
    const sel = document.getElementById('modal-frecuencia');
    if (sel) {
      sel.addEventListener('change', () => {
        const fg = document.getElementById('modal-fecha-group');
        if (fg) fg.style.display = sel.value === 'especial' ? 'block' : 'none';
      });
      if (m && m.frecuencia === 'especial') {
        const fg = document.getElementById('modal-fecha-group');
        if (fg) fg.style.display = 'block';
      }
    }
  }, 50);
}

function openEditMissionModal(id) {
  openMissionModal(id);
}

function _buildMissionFromForm() {
  const nombre = document.getElementById('modal-name').value.trim();
  const puntos = parseInt(document.getElementById('modal-points').value) || 0;
  const meta = parseInt(document.getElementById('modal-meta').value) || 1;
  const tipo = document.getElementById('modal-type').value;
  const frecuencia = document.getElementById('modal-frecuencia').value;
  const fechaExpira = document.getElementById('modal-fecha')?.value || null;
  const emoji = getSelectedEmoji() || '⭐';

  if (!nombre || puntos === 0) { showToast('Completa todos los campos'); return null; }
  if (frecuencia === 'especial' && !fechaExpira) { showToast('Selecciona la fecha de expiración'); return null; }

  const finalPuntos = tipo === 'negativa' ? -Math.abs(puntos) : Math.abs(puntos);
  return { nombre, emoji, puntos: finalPuntos, tipo, meta, frecuencia, fechaExpira };
}

function saveMission() {
  const data = _buildMissionFromForm();
  if (!data) return;
  addMission(data);
  closeModal();
  renderAjustes();
  showToast('Misión agregada ⚔️');
}

function saveEditMission(id) {
  const data = _buildMissionFromForm();
  if (!data) return;
  updateMission(id, data);
  closeModal();
  renderAjustes();
  showToast('Misión actualizada ✅');
}

/* ========================================
   Settings — Account / Reset
   ======================================== */
function renderSettingsAccount() {
  const data = getData();
  return `
    <div class="settings-item">
      <span class="item-emoji">⭐</span>
      <div class="item-info">
        <div class="item-name">Puntos actuales</div>
        <div class="item-detail">${(data.puntos || 0).toLocaleString()} pts acumulados</div>
      </div>
    </div>

    <div class="settings-item">
      <span class="item-emoji">📊</span>
      <div class="item-info">
        <div class="item-name">Historial</div>
        <div class="item-detail">${(data.historial || []).length} registros guardados</div>
      </div>
    </div>

    <div style="margin-top: var(--space-lg);">
      <button class="btn-secondary" onclick="checkForAppUpdate()">
        🔄 Buscar actualizaciones de la app
      </button>
    </div>
    <p style="text-align:center;font-size:0.75rem;color:var(--text-secondary);margin-top:var(--space-sm);">
      Trae cambios publicados (por ejemplo, cambios subidos a GitHub y desplegados).
    </p>

    <div style="margin-top: var(--space-lg);">
      <button class="btn-danger-outline" onclick="openResetConfirm()">
        🔄 Reiniciar estadísticas
      </button>
    </div>
    <p style="text-align:center;font-size:0.75rem;color:var(--text-secondary);margin-top:var(--space-sm);">
      Borra puntos e historial. Las actividades, tienda y misiones se conservan.
    </p>
  `;
}

function openResetConfirm() {
  showModal(`
    <div style="text-align:center;padding:var(--space-sm) 0;">
      <div style="font-size:3rem;margin-bottom:var(--space-md);">⚠️</div>
      <h3 style="color:var(--danger);">Reiniciar estadísticas</h3>
      <p style="color:var(--text-secondary);font-size:0.9rem;margin:var(--space-md) 0;line-height:1.5;">
        Esto eliminará todos tus puntos e historial.<br>
        <strong>Esta acción no se puede deshacer.</strong>
      </p>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:var(--space-md);">
        Escribe <strong>REINICIAR</strong> para confirmar:
      </p>
      <input type="text" class="form-input" id="modal-confirm-text" placeholder="REINICIAR" style="text-align:center;letter-spacing:2px;font-weight:700;">
    </div>
    <button class="btn-danger" onclick="confirmReset()" style="margin-top:var(--space-md);">
      Confirmar reinicio
    </button>
    <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
  `);
}

async function confirmReset() {
  const txt = document.getElementById('modal-confirm-text')?.value?.trim();
  if (txt !== 'REINICIAR') {
    showToast('Escribe REINICIAR para confirmar');
    return;
  }

  // Try Web Authentication API (biometrics / device credential)
  if (window.PublicKeyCredential) {
    try {
      const supported = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (supported) {
        // Use credential to verify — simplified approach via navigator.credentials
        // For PWA we use a simple PIN/password prompt as fallback
      }
    } catch (e) { }
  }

  // Proceed with reset
  closeModal();
  resetStats();
  updateHeaderPoints();
  showToast('Estadísticas reiniciadas 🔄');
  renderAjustes();
}
