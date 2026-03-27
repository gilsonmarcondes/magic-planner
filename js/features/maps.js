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

// 🌦️ FUNÇÃO DE CLIMA (Com Trava de 5 dias para sua viagem em Abril)
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
            return alert(`📅 Cedo demais! Previsão para ${d.locations[0].name.split(',')[0]} disponível a partir de ${dataLib.toLocaleDateString('pt-BR')}.`);
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
                html += `<div class="flex flex-col items-center bg-white/60 rounded-lg p-2 min-w-[65px]">
                            <span class="text-[11px] font-bold">${temp}°</span>
                            <img src="${icon}" class="w-8 h-8">
                         </div>`;
            });
            html += `</div>`;
            d.weather = html;
            await saveData();
            window.render();
        }
    } catch (e) { console.error(e); }
}

export function openFullDayRoute() { /* ... lógica de rota ... */ }
export function initOriginAutocomplete(id) { /* ... lógica autocomplete ... */ }
export function calcInlineRoute(id) { /* ... lógica rota inline ... */ }
export function openGPSRoute(id) { /* ... lógica gps ... */ }
export function useMyLocation(id) { /* ... lógica localização ... */ }

// --- 📡 FUNÇÕES DO RADAR (Importantes para o main.js) ---
export function openRadarModal() {
    alert("📡 O Radar de Atrações está sendo calibrado! Em breve você poderá localizar pontos próximos.");
}
export function scanRadar() {
    console.log("Escaneando área...");
}