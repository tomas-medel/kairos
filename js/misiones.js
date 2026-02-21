/* ========================================
   KAIROS — Misiones Screen v2
   ======================================== */

function renderMisiones() {
  const missions = getMissions();
  const container = document.getElementById('main-content');
  const today = todayStr();

  let html = `
    <div class="section-header">
      <span class="section-icon">🏆</span>
      <h2>Misiones</h2>
      <p>Completa misiones y gana puntos</p>
    </div>
  `;

  if (missions.length === 0) {
    html += `
      <div class="day-off" style="padding: var(--space-md);">
        <p style="color: var(--text-secondary);">Agrega misiones desde Ajustes ⚙️</p>
      </div>
    `;
    container.innerHTML = html;
    updateMissionsBadge();
    return;
  }

  // Filter out expired special missions
  const active = missions.filter(m => {
    if (m.frecuencia === 'especial' && m.fechaExpira && m.fechaExpira < today) return false;
    return true;
  });

  const positive = active.filter(m => m.tipo === 'positiva');
  const negative = active.filter(m => m.tipo === 'negativa');

  if (positive.length > 0) {
    html += `<p class="misiones-section-label">✅ Positivas</p>`;
    positive.forEach((mission, i) => {
      html += renderMissionCard(mission, i);
    });
  }

  if (negative.length > 0) {
    html += `<p class="misiones-section-label" style="margin-top:var(--space-md)">❌ Penalizaciones</p>`;
    negative.forEach((mission, i) => {
      html += renderMissionCard(mission, positive.length + i);
    });
  }

  html += `
    <button class="btn-add" style="margin-top:var(--space-md);" onclick="navigate('ajustes'); setSettingsTab('misiones');">
      + Agregar misión (en Ajustes)
    </button>
  `;

  container.innerHTML = html;
  updateMissionsBadge();
}

function renderMissionCard(mission, i) {
  const prog = getMissionProgress(mission.id);
  const isPositive = mission.tipo === 'positiva';
  const meta = mission.meta || 1;
  const pctFill = Math.min((prog.progreso / meta) * 100, 100);

  const frecLabel = {
    diaria: '🔁',
    unica: '1️⃣',
    especial: '📅'
  }[mission.frecuencia] || '🔁';

  // For unique missions already completed — show completed state
  const alreadyDone = mission.frecuencia === 'unica' && prog.completada;

  return `
    <div class="mission-item" style="animation-delay: ${i * 0.06}s; opacity: ${alreadyDone ? 0.5 : 1}">
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
            <span style="font-size:0.75rem; font-weight:400; color:var(--text-secondary);">${frecLabel}</span>
          </div>
          ${isPositive && meta > 1 ? `
            <div class="mission-counter">${prog.progreso} / ${meta}</div>
            <div class="mission-progress">
              <div class="mission-progress-fill" style="width: ${pctFill}%"></div>
            </div>
          ` : ''}
          ${alreadyDone ? `<div class="mission-counter" style="color:var(--success)">✅ Completada</div>` : ''}
        </div>
        <span class="mission-points ${isPositive ? 'positive' : 'negative'}">
          ${isPositive ? '+' : ''}${mission.puntos} pts
        </span>
      </div>
    </div>
  `;
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
  const today = todayStr();
  let pending = 0;

  missions.filter(m => m.tipo === 'positiva').forEach(m => {
    if (m.frecuencia === 'especial' && m.fechaExpira && m.fechaExpira < today) return;
    const prog = getMissionProgress(m.id);
    if (!prog.completada) pending++;
  });

  const badge = document.getElementById('missions-badge');
  if (badge) {
    badge.textContent = pending;
    badge.style.display = pending > 0 ? 'block' : 'none';
  }
}
