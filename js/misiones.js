/* ========================================
   KAIROS — Misiones Screen
   ======================================== */

function renderMisiones() {
    const missions = getMissions();
    const container = document.getElementById('main-content');

    let html = `
    <div class="section-header">
      <span class="section-icon">🏆🎯</span>
      <h2>Misiones</h2>
      <p>Completa misiones diarias y gana puntos</p>
    </div>
  `;

    if (missions.length === 0) {
        html += `
      <div class="day-off" style="padding: var(--space-md);">
        <p style="color: var(--text-secondary);">Agrega misiones desde Ajustes ⚙️</p>
      </div>
    `;
    }

    // Positive missions first, then negative
    const positive = missions.filter(m => m.tipo === 'positiva');
    const negative = missions.filter(m => m.tipo === 'negativa');

    [...positive, ...negative].forEach((mission, i) => {
        const prog = getMissionProgress(mission.id);
        const isPositive = mission.tipo === 'positiva';
        const meta = mission.meta || 1;
        const pctFill = Math.min((prog.progreso / meta) * 100, 100);

        html += `
      <div class="mission-item" style="animation-delay: ${i * 0.06}s">
        <div class="mission-row">
          ${isPositive ? `
            <button class="mission-check ${prog.completada ? 'checked' : ''}" 
                    onclick="handleMissionClick('${mission.id}')"
                    ${prog.completada ? 'disabled' : ''}>
              ${prog.completada ? '✓' : ''}
            </button>
          ` : `
            <button class="mission-check negative" 
                    onclick="handleNegativeMission('${mission.id}')">
              ✕
            </button>
          `}
          <div class="mission-info">
            <div class="mission-name">
              <span class="emoji">${mission.emoji || '⭐'}</span>
              ${mission.nombre}
            </div>
            ${isPositive && meta > 1 ? `
              <div class="mission-counter">${prog.progreso} / ${meta}</div>
              <div class="mission-progress">
                <div class="mission-progress-fill" style="width: ${pctFill}%"></div>
              </div>
            ` : ''}
          </div>
          <span class="mission-points ${isPositive ? 'positive' : 'negative'}">
            ${isPositive ? '+' : ''}${mission.puntos} pts
          </span>
        </div>
      </div>
    `;
    });

    html += `
    <button class="btn-add" onclick="openMissionModal()">
      + Agregar misión
    </button>
  `;

    container.innerHTML = html;
    updateMissionsBadge();
}

function handleMissionClick(id) {
    const result = incrementMission(id);
    if (result && result.completada) {
        showPointsPop(true);
    }
    updateHeaderPoints();
    renderMisiones();
}

function handleNegativeMission(id) {
    triggerNegativeMission(id);
    showPointsPop(false);
    updateHeaderPoints();
    renderMisiones();
}

function updateMissionsBadge() {
    const missions = getMissions();
    const positive = missions.filter(m => m.tipo === 'positiva');
    let pending = 0;
    positive.forEach(m => {
        const prog = getMissionProgress(m.id);
        if (!prog.completada) pending++;
    });

    const badge = document.getElementById('missions-badge');
    if (badge) {
        if (pending > 0) {
            badge.textContent = pending;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function openMissionModal() {
    showModal(`
    <h3>Nueva Misión</h3>
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" class="form-input" id="modal-name" placeholder="Ej: Tomar 7 vasos de agua">
    </div>
    <div class="form-group">
      <label>Emoji</label>
      <div class="emoji-grid" id="modal-emoji-grid"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Puntos</label>
        <input type="number" class="form-input" id="modal-points" placeholder="10">
      </div>
      <div class="form-group">
        <label>Meta (repeticiones)</label>
        <input type="number" class="form-input" id="modal-meta" placeholder="1" min="1" value="1">
      </div>
    </div>
    <div class="form-group">
      <label>Tipo</label>
      <select class="form-input" id="modal-type">
        <option value="positiva">✅ Positiva (suma puntos)</option>
        <option value="negativa">❌ Negativa (resta puntos)</option>
      </select>
    </div>
    <button class="btn-primary" onclick="saveMission()">Guardar</button>
    <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
  `);

    renderEmojiGrid('modal-emoji-grid', ['💧', '📖', '🧘', '🏋️', '🙏', '🌙', '🤬', '📵', '🍬', '🚶', '💊', '☕']);
}

function saveMission() {
    const nombre = document.getElementById('modal-name').value.trim();
    const puntos = parseInt(document.getElementById('modal-points').value) || 0;
    const meta = parseInt(document.getElementById('modal-meta').value) || 1;
    const tipo = document.getElementById('modal-type').value;
    const emoji = getSelectedEmoji() || '⭐';

    if (!nombre || puntos === 0) {
        showToast('Completa todos los campos');
        return;
    }

    const finalPuntos = tipo === 'negativa' ? -Math.abs(puntos) : Math.abs(puntos);

    addMission({ nombre, emoji, puntos: finalPuntos, tipo, meta });
    closeModal();
    renderMisiones();
    showToast('Misión agregada ⚔️');
}
