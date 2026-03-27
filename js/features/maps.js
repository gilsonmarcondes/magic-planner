import { appData, currentState, saveData, currentInlineModes } from '../store.js';
import { OPENWEATHER_API_KEY } from '../config.js';

let cityAutocompleteInstance = null;

export function openCitySearch() {
    const modal = document.getElementById('citySearchModal');
    if (modal) modal.classList.remove('hidden');
    if (!cityAutocompleteInstance && window.google) {
        const input = document.getElementById('citySearchInput');
        if (input) cityAutocompleteInstance = new google.maps.places.Autocomplete(input, { types: ['(cities)'] });
    }
}

export async function addLocation() {
    const input = document.getElementById('citySearchInput');
    if (!input?.value) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    if (!d.locations) d.locations = [];
    d.locations.push({ name: input.value });
    input.value = '';
    await saveData();
    window.render();
}

export async function removeLocation(name) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.locations = d.locations.filter(l => l.name !== name);
    await saveData();
    window.render();
}

export async function fetchWeather() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    if (!d.locations || d.locations.length === 0) return alert('Adicione uma cidade primeiro.');

    if (d.date) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataViagem = new Date(d.date + "T00:00:00");
        const diffDias = Math.ceil((dataViagem - hoje) / (1000 * 60 * 60 * 24));
        if (diffDias > 5) {
            const dataLib = new Date(dataViagem);
            dataLib.setDate(dataLib.getDate() - 5);
            return alert(`📅 Previsão disponível a partir de ${dataLib.toLocaleDateString('pt-BR')}.`);
        }
    }

    const city = d.locations[0].name.split(',')[0];
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.list) {
            const proximas24h = data.list.slice(0, 8);
            let html = `<div class="flex overflow-x-auto gap-2 py-2 mt-2">`;
            proximas24h.forEach(item => {
                const temp = Math.round(item.main.temp);
                const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
                html += `<div class="flex flex-col items-center bg-white/60 p-2 min-w-[65px]"><span class="text-[11px] font-bold">${temp}°</span><img src="${icon}" class="w-8 h-8"></div>`;
            });
            html += `</div>`;
            d.weather = html;
            await saveData();
            window.render();
        }
    } catch (e) { console.error(e); }
}

export function openFullDayRoute() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const waypoints = d.attractions.map(a => a.address).filter(a => !!a);
    if (waypoints.length < 2) return alert('Faltam endereços.');
    const origin = waypoints.shift();
    const destination = waypoints.pop();
    const wpString = waypoints.length > 0 ? `&waypoints=${waypoints.map(encodeURIComponent).join('|')}` : '';
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${wpString}&travelmode=walking`, '_blank');
}

export function initOriginAutocomplete(id) {
    if (!window.google) return;
    const input = document.getElementById(`origin-${id}`);
    if (input && !input.dataset.autocompleteBound) {
        new google.maps.places.Autocomplete(input);
        input.dataset.autocompleteBound = "true";
    }
}

export function calcInlineRoute(id) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = d.attractions.find(x => String(x.id) === String(id));
    const origin = document.getElementById(`origin-${id}`).value;
    if (!origin || !a.address) return alert('Preencha origem e destino.');
    const frame = document.getElementById(`map-frame-${id}`);
    const container = document.getElementById(`map-container-${id}`);
    const apiKey = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]').src.match(/key=([^&]+)/)[1];
    frame.src = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(a.address)}&mode=walking`;
    container.classList.remove('hidden');
}

export function openGPSRoute(id) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = d.attractions.find(x => String(x.id) === String(id));
    const origin = document.getElementById(`origin-${id}`).value || 'My Location';
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(a.address)}&travelmode=walking`, '_blank');
}

export function useMyLocation(id) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const input = document.getElementById(`origin-${id}`);
            if (input) input.value = `${pos.coords.latitude},${pos.coords.longitude}`;
        });
    }
}

export function openRadarModal() { alert("📡 Radar em calibração..."); }
export function scanRadar() { console.log("Escaneando..."); }