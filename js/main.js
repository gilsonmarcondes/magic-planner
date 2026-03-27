// --- FEATURE: MAPS & WEATHER ---
import { appData, currentState, saveData, currentInlineModes, setCurrentInlineModes } from '../store.js';
import { OPENWEATHER_API_KEY } from '../config.js';

let cityAutocompleteInstance = null;
let originAutocompleteInstance = null;

export function openCitySearch() {
    const modal = document.getElementById('citySearchModal');
    if (modal) modal.classList.remove('hidden');
    
    if (!cityAutocompleteInstance && window.google) {
        const input = document.getElementById('citySearchInput');
        if (input) {
            cityAutocompleteInstance = new google.maps.places.Autocomplete(input, { types: ['(cities)'] });
        }
    }
}

export async function addLocation() {
    const input = document.getElementById('citySearchInput');
    const cityName = input?.value;
    if (!cityName) return;

    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    
    if (!d.locations) d.locations = [];
    d.locations.push({ name: cityName });
    
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

// 🌦️ FUNÇÃO DE CLIMA (Com Trava Inteligente de 5 dias)
export async function fetchWeather() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    
    if (!d.locations || d.locations.length === 0) return alert('Adicione uma cidade primeiro.');

    // --- 🛡️ TRAVA INTELIGENTE: Janela de 5 dias ---
    if (d.date) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); 
        
        const dataViagem = new Date(d.date + "T00:00:00");
        
        const diffTempo = dataViagem - hoje;
        const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

        if (diffDias > 5) {
            const dataLiberacao = new Date(dataViagem);
            dataLiberacao.setDate(dataLiberacao.getDate() - 5);
            return alert(`📅 Cedo demais! A previsão para ${d.locations[0].name.split(',')[0]} só estará disponível a partir de ${dataLiberacao.toLocaleDateString('pt-BR')}.`);
        } else if (diffDias < 0) {
            return alert(`⏳ Esse dia já passou! Não consigo buscar o clima de datas retroativas.`);
        }
    }

    const city = d.locations[0].name.split(',')[0];
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.list) {
            const proximas24h = data.list.slice(0, 8);
            let html = `<div class="flex overflow-x-auto gap-2 py-2 mt-2" style="scrollbar-width: none; -ms-overflow-style: none;">`;
            
            proximas24h.forEach(item => {
                const date = new Date(item.dt * 1000);
                const hours = date.getHours().toString().padStart(2, '0') + ':00';
                const temp = Math.round(item.main.temp);
                const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
                const desc = item.weather[0].description;
                
                html += `
                    <div class="flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm border border-blue-100/50 rounded-lg p-2 min-w-[65px] shrink-0">
                        <span class="text-[9px] font-bold text-slate-500">${hours}</span>
                        <img src="${icon}" alt="${desc}" title="${desc}" class="w-8 h-8 drop-shadow-sm -my-1">
                        <span class="text-[11px] font-bold text-slate-800">${temp}°</span>
                    </div>
                `;
            });
            html += `</div>`;

            d.weather = html;
            await saveData();
            window.render();
        } else {
            alert('Cidade não encontrada ou erro na API.');
        }
    } catch (e) { 
        console.error('Erro clima:', e); 
        alert('Erro ao conectar com o servidor de clima.');
    }
}

export function openFullDayRoute() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    
    const waypoints = d.attractions.map(a => a.address).filter(a => !!a);
    if (waypoints.length < 2) return alert('É necessário pelo menos 2 endereços nas atrações para traçar uma rota.');
    
    const origin = waypoints.shift();
    const destination = waypoints.pop();
    const wpString = waypoints.length > 0 ? `&waypoints=${waypoints.map(encodeURIComponent).join('|')}` : '';
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${wpString}&travelmode=walking`;
    window.open(url, '_blank');
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
    const modeMap = { 'd': 'DRIVING', 't': 'TRANSIT', 'w': 'WALKING' };
    const mode = modeMap[currentInlineModes[id] || 'd'];

    if (!origin || !a.address) return alert('Preencha a origem e o endereço da atração.');

    const frame = document.getElementById(`map-frame-${id}`);
    const container = document.getElementById(`map-container-${id}`);
    
    // Captura a chave da API do script carregado
    const apiKey = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]').src.match(/key=([^&]+)/)[1];
    frame.src = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(a.address)}&mode=${mode.toLowerCase()}`;
    container.classList.remove('hidden');
}

export function openGPSRoute(id) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = d.attractions.find(x => String(x.id) === String(id));
    const origin = document.getElementById(`origin-${id}`).value || 'My Location';
    
    const modeMap = { 'd': 'driving', 't': 'transit', 'w': 'walking' };
    const mode = modeMap[currentInlineModes[id] || 'd'];
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(a.address)}&travelmode=${mode}`;
    window.open(url, '_blank');
}

export function useMyLocation(id) {
    if (navigator.geolocation) {
        const btn = document.getElementById(`gps-btn-${id}`);
        const originalText = btn.innerText;
        btn.innerText = '⌛ Localizando...';
        
        navigator.geolocation.getCurrentPosition((pos) => {
            const latlng = `${pos.coords.latitude},${pos.coords.longitude}`;
            const input = document.getElementById(`origin-${id}`);
            if (input) input.value = latlng;
            btn.innerText = '📍 Localização capturada!';
            setTimeout(() => btn.innerText = originalText, 2000);
        }, (err) => {
            console.error(err);
            btn.innerText = '❌ Erro ao localizar';
            setTimeout(() => btn.innerText = originalText, 2000);
        });
    } else {
        alert("Geolocalização não suportada pelo seu navegador.");
    }
}

// --- FUNÇÕES DO RADAR ---
export function openRadarModal() {
    alert("📡 O Radar de Atrações está sendo calibrado! Em breve você poderá localizar pontos de interesse próximos a você.");
}

export function scanRadar() {
    console.log("Escaneando área...");
}