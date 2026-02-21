/* ========================================
   KAIROS — Home Screen
   ======================================== */

function renderHome(selectedDay) {
    const day = selectedDay || getDayName();
    const activities = getActivities(day);
    const container = document.getElementById('main-content');
    const now = getCurrentTimeMinutes();
    const isToday = day === getDayName();

    if (activities.length === 0) {
        container.innerHTML = renderDayOff();
        return;
    }

    let currentActivity = null;
    let nextActivity = null;

    if (isToday) {
        for (let i = 0; i < activities.length; i++) {
            const start = timeToMinutes(activities[i].horaInicio);
            const end = timeToMinutes(activities[i].horaFin);
            if (now >= start && now < end) {
                currentActivity = activities[i];
                nextActivity = activities[i + 1] || null;
                break;
            }
        }
        // If no current, find the next upcoming
        if (!currentActivity) {
            for (let i = 0; i < activities.length; i++) {
                const start = timeToMinutes(activities[i].horaInicio);
                if (now < start) {
                    nextActivity = activities[i];
                    break;
                }
            }
        }
    }

    let html = '';

    // Current Activity Card
    if (currentActivity) {
        html += `
      <div class="current-activity">
        <div class="activity-name">${currentActivity.emoji || '📌'} ${currentActivity.nombre}</div>
        <div class="activity-time">${currentActivity.horaInicio} - ${currentActivity.horaFin}</div>
        ${nextActivity ? `<div class="next-hint">Luego: ${nextActivity.nombre}</div>` : ''}
      </div>
    `;
    } else if (isToday && nextActivity) {
        // Show next upcoming if nothing going on now
        html += `
      <div class="current-activity" style="border-color: var(--warning); background: var(--warning-bg);">
        <div class="activity-time" style="color: var(--text-secondary); font-size: 0.85rem;">Próxima actividad</div>
        <div class="activity-name">${nextActivity.emoji || '📌'} ${nextActivity.nombre}</div>
        <div class="activity-time">${nextActivity.horaInicio} - ${nextActivity.horaFin}</div>
      </div>
    `;
    }

    // Activity Timeline
    html += '<div class="activity-timeline">';

    activities.forEach((act, i) => {
        const start = timeToMinutes(act.horaInicio);
        const end = timeToMinutes(act.horaFin);
        let extraClass = '';

        if (isToday) {
            if (now >= end) extraClass = 'is-past';
            else if (currentActivity && act.id === currentActivity.id) extraClass = '';
            else if (nextActivity && act.id === nextActivity.id) extraClass = 'is-next';
        }

        html += `
      <div class="activity-card ${extraClass}" style="animation-delay: ${i * 0.06}s">
        <div class="timeline-dot"></div>
        <div class="activity-row">
          <span class="activity-emoji">${act.emoji || '📌'}</span>
          <div class="activity-info">
            <div class="activity-name">${act.nombre}</div>
            <div class="activity-time">${act.horaInicio} - ${act.horaFin}</div>
          </div>
          <span class="activity-chevron">›</span>
        </div>
      </div>
    `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderDayOff() {
    return `
    <div class="day-off">
      <div class="day-off-illustration">🌟📅</div>
      <h2>Día libre</h2>
      <p>Configura tus actividades desde Ajustes</p>
    </div>
  `;
}
