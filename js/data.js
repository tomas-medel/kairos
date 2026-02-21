/* ========================================
   KAIROS — Data Layer (localStorage)
   ======================================== */

const DATA_KEY = 'kairos_data';

const DEFAULT_EMOJIS = ['📚', '💻', '🏋️', '🍽️', '🛌', '🧹', '✝️', '🎮', '📖', '🧘', '🚶', '💼', '🎵', '🎨', '🏠', '🍕', '🍦', '🎬', '🛒', '💊', '🧠', '📝', '☕', '🌙'];

function getDefaultData() {
    return {
        puntos: 0,
        schedule: {
            lunes: [],
            martes: [],
            miercoles: [],
            jueves: [],
            viernes: [],
            sabado: [],
            domingo: []
        },
        tienda: [],
        misiones: [],
        historial: [],
        misionesProgreso: {} // { misionId: { fecha: "YYYY-MM-DD", progreso: N, completada: bool } }
    };
}

function getData() {
    try {
        const raw = localStorage.getItem(DATA_KEY);
        if (!raw) return initDefaultData();
        const data = JSON.parse(raw);
        // Ensure all keys exist
        const defaults = getDefaultData();
        for (const key of Object.keys(defaults)) {
            if (!(key in data)) data[key] = defaults[key];
        }
        return data;
    } catch (e) {
        console.error('Error reading data:', e);
        return initDefaultData();
    }
}

function saveData(data) {
    try {
        localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

function initDefaultData() {
    const data = getDefaultData();
    saveData(data);
    return data;
}

/* ========================================
   Utility: IDs
   ======================================== */
function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function getDayName(date) {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return days[(date || new Date()).getDay()];
}

function getDayLabel(dayName) {
    const labels = {
        lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
        jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo'
    };
    return labels[dayName] || dayName;
}

function getCurrentTimeMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
}

function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/* ========================================
   Schedule CRUD
   ======================================== */
function getActivities(dayName) {
    const data = getData();
    const activities = data.schedule[dayName] || [];
    return activities.sort((a, b) => timeToMinutes(a.horaInicio) - timeToMinutes(b.horaInicio));
}

function addActivity(dayName, activity) {
    const data = getData();
    if (!data.schedule[dayName]) data.schedule[dayName] = [];
    activity.id = genId();
    data.schedule[dayName].push(activity);
    saveData(data);
    return activity;
}

function updateActivity(dayName, id, updates) {
    const data = getData();
    const list = data.schedule[dayName] || [];
    const idx = list.findIndex(a => a.id === id);
    if (idx >= 0) {
        data.schedule[dayName][idx] = { ...list[idx], ...updates };
        saveData(data);
    }
}

function deleteActivity(dayName, id) {
    const data = getData();
    data.schedule[dayName] = (data.schedule[dayName] || []).filter(a => a.id !== id);
    saveData(data);
}

/* ========================================
   Shop CRUD
   ======================================== */
function getShopItems() {
    return getData().tienda || [];
}

function addShopItem(item) {
    const data = getData();
    item.id = genId();
    data.tienda.push(item);
    saveData(data);
    return item;
}

function deleteShopItem(id) {
    const data = getData();
    data.tienda = data.tienda.filter(i => i.id !== id);
    saveData(data);
}

function buyItem(id) {
    const data = getData();
    const item = data.tienda.find(i => i.id === id);
    if (!item || data.puntos < item.precio) return false;
    data.puntos -= item.precio;
    data.historial.push({
        fecha: todayStr(),
        tipo: 'compra',
        detalle: item.nombre,
        puntos: -item.precio
    });
    saveData(data);
    return true;
}

/* ========================================
   Missions CRUD
   ======================================== */
function getMissions() {
    return getData().misiones || [];
}

function addMission(mission) {
    const data = getData();
    mission.id = genId();
    data.misiones.push(mission);
    saveData(data);
    return mission;
}

function updateMission(id, updates) {
    const data = getData();
    const idx = data.misiones.findIndex(m => m.id === id);
    if (idx >= 0) {
        data.misiones[idx] = { ...data.misiones[idx], ...updates };
        saveData(data);
    }
}

function deleteMission(id) {
    const data = getData();
    data.misiones = data.misiones.filter(m => m.id !== id);
    // Also clean up progress
    delete data.misionesProgreso[id];
    saveData(data);
}

function getMissionProgress(missionId) {
    const data = getData();
    const today = todayStr();
    const prog = data.misionesProgreso[missionId];
    if (prog && prog.fecha === today) return prog;
    return { fecha: today, progreso: 0, completada: false };
}

function incrementMission(missionId) {
    const data = getData();
    const mission = data.misiones.find(m => m.id === missionId);
    if (!mission) return null;

    const today = todayStr();
    if (!data.misionesProgreso[missionId] || data.misionesProgreso[missionId].fecha !== today) {
        data.misionesProgreso[missionId] = { fecha: today, progreso: 0, completada: false };
    }

    const prog = data.misionesProgreso[missionId];
    if (prog.completada) return prog;

    prog.progreso++;

    const meta = mission.meta || 1;
    if (prog.progreso >= meta) {
        prog.completada = true;
        data.puntos += mission.puntos;
        data.historial.push({
            fecha: today,
            tipo: 'mision',
            detalle: mission.nombre,
            puntos: mission.puntos
        });
    }

    saveData(data);
    return prog;
}

function triggerNegativeMission(missionId) {
    const data = getData();
    const mission = data.misiones.find(m => m.id === missionId);
    if (!mission) return null;

    const today = todayStr();
    if (!data.misionesProgreso[missionId] || data.misionesProgreso[missionId].fecha !== today) {
        data.misionesProgreso[missionId] = { fecha: today, progreso: 0, completada: false };
    }

    const prog = data.misionesProgreso[missionId];
    prog.progreso++;
    data.puntos += mission.puntos; // puntos is negative for negative missions
    data.historial.push({
        fecha: today,
        tipo: 'mision',
        detalle: mission.nombre,
        puntos: mission.puntos
    });

    saveData(data);
    return prog;
}

function getPoints() {
    return getData().puntos || 0;
}

function getHistorial(startDate, endDate) {
    const data = getData();
    return (data.historial || []).filter(h => h.fecha >= startDate && h.fecha <= endDate);
}
