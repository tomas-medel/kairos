/* ========================================
   KAIROS — Análisis Screen
   ======================================== */

function renderAnalisis() {
    const container = document.getElementById('main-content');

    // Show sub-header and hide main header/day selector
    document.querySelector('.app-header').classList.add('hidden');
    document.querySelector('.day-selector').classList.add('hidden');

    const activeTab = window._analysisTab || 'semanal';

    let html = `
    <div class="sub-header">
      <button class="btn-back" onclick="goBack()">←</button>
      <h1>Análisis</h1>
    </div>
    <div class="analysis-tabs">
      <button class="analysis-tab ${activeTab === 'diario' ? 'active' : ''}" onclick="setAnalysisTab('diario')">Diario</button>
      <button class="analysis-tab ${activeTab === 'semanal' ? 'active' : ''}" onclick="setAnalysisTab('semanal')">Semanal</button>
      <button class="analysis-tab ${activeTab === 'mensual' ? 'active' : ''}" onclick="setAnalysisTab('mensual')">Mensual</button>
    </div>
  `;

    // Calculate date range
    const now = new Date();
    let startDate, endDate, periodLabel;

    if (activeTab === 'diario') {
        startDate = todayStr();
        endDate = todayStr();
        periodLabel = formatDateLabel(now);
    } else if (activeTab === 'semanal') {
        const dayOfWeek = now.getDay() || 7; // Mon=1
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        startDate = monday.toISOString().slice(0, 10);
        endDate = sunday.toISOString().slice(0, 10);
        periodLabel = `${formatShortDate(monday)} - ${formatShortDate(sunday)}`;
    } else {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = firstDay.toISOString().slice(0, 10);
        endDate = lastDay.toISOString().slice(0, 10);
        periodLabel = getMonthName(now.getMonth()) + ' ' + now.getFullYear();
    }

    const historial = getHistorial(startDate, endDate);

    const totalPoints = historial.reduce((sum, h) => sum + h.puntos, 0);
    const misionesCompletadas = historial.filter(h => h.tipo === 'mision' && h.puntos > 0);
    const misionesFalladas = historial.filter(h => h.tipo === 'mision' && h.puntos < 0);
    const compras = historial.filter(h => h.tipo === 'compra');

    html += `
    <div class="analysis-period">
      <div class="analysis-points">${totalPoints >= 0 ? '+' : ''}${totalPoints} pts</div>
      <div class="analysis-date">${periodLabel}</div>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value positive">+${misionesCompletadas.length}</div>
        <div class="stat-label">Completadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-value negative">-${misionesFalladas.length}</div>
        <div class="stat-label">Falladas</div>
      </div>
    </div>
  `;

    // Activity distribution (donut chart)
    const data = getData();
    const allDays = Object.keys(data.schedule);
    const activityDurations = {};
    let totalMinutes = 0;

    allDays.forEach(day => {
        (data.schedule[day] || []).forEach(act => {
            const duration = timeToMinutes(act.horaFin) - timeToMinutes(act.horaInicio);
            if (duration > 0) {
                if (!activityDurations[act.nombre]) {
                    activityDurations[act.nombre] = { minutes: 0, emoji: act.emoji || '📌' };
                }
                activityDurations[act.nombre].minutes += duration;
                totalMinutes += duration;
            }
        });
    });

    if (totalMinutes > 0) {
        const sorted = Object.entries(activityDurations)
            .sort((a, b) => b[1].minutes - a[1].minutes)
            .slice(0, 5);

        // Build conic gradient for donut
        const colors = ['#7c83ff', '#4ecb71', '#ffc554', '#c084fc', '#ff6b6b'];
        let gradientParts = [];
        let accumulated = 0;

        sorted.forEach(([name, data], i) => {
            const pct = (data.minutes / totalMinutes) * 100;
            gradientParts.push(`${colors[i]} ${accumulated}% ${accumulated + pct}%`);
            accumulated += pct;
        });
        if (accumulated < 100) {
            gradientParts.push(`var(--border-color) ${accumulated}% 100%`);
        }

        html += `
      <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: var(--space-md);">Más actividad</h3>
      <div class="donut-container">
        <div class="donut" style="background: conic-gradient(${gradientParts.join(', ')});">
          <div style="position:absolute;inset:25%;border-radius:50%;background:var(--bg-card);"></div>
        </div>
        <div class="donut-legend">
    `;

        sorted.forEach(([name, d], i) => {
            const pct = Math.round((d.minutes / totalMinutes) * 100);
            const hrs = Math.floor(d.minutes / 60);
            const mins = d.minutes % 60;
            html += `
        <div class="donut-legend-item">
          <div class="donut-legend-dot" style="background: ${colors[i]}"></div>
          <span class="donut-legend-pct">${pct}%</span>
          <span>${d.emoji} ${name}</span>
          <span class="donut-legend-time">${hrs}h ${mins}m</span>
        </div>
      `;
        });

        html += `</div></div>`;
    }

    // Recent activity list
    if (historial.length > 0) {
        html += `<h3 style="font-size: 0.95rem; font-weight: 700; margin: var(--space-lg) 0 var(--space-md);">Historial</h3>`;
        html += `<div class="card">`;
        historial.slice(-10).reverse().forEach(h => {
            const icon = h.tipo === 'compra' ? '🛒' : (h.puntos > 0 ? '✅' : '❌');
            html += `
        <div class="activity-list-item">
          <span class="item-emoji">${icon}</span>
          <span class="item-name">${h.detalle}</span>
          <span class="item-duration" style="color: ${h.puntos >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">
            ${h.puntos >= 0 ? '+' : ''}${h.puntos} pts
          </span>
        </div>
      `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
}

function setAnalysisTab(tab) {
    window._analysisTab = tab;
    renderAnalisis();
}

function formatDateLabel(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('es', options);
}

function formatShortDate(date) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

function getMonthName(month) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month];
}
