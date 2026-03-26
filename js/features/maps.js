// --- FEATURE: MAPS & WEATHER ---
import { appData, currentState, currentInlineModes, cityAutocomplete, saveData, setCityAutocomplete } from '../store.js';
import { closeModals, randomId, formatDateBr } from '../utils.js'; // Adicionado formatDateBr no import

// IMPORTAÇÃO DAS CHAVES DE API
import { GOOGLE_API_KEY, OPENWEATHER_API_KEY } from '../config.js';

// --- 1. BUSCA DE CIDADES (GOOGLE PLACES) ---
export function openCitySearch() {
    const modal = document.getElementById('cityModal');
    const input = document.getElementById('citySearchInput');
    
    if (modal) modal.classList.add('active');
    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 200);
    }

    if (!cityAutocomplete && window.google?.maps?.places) {
        initCityAutocomplete();
    }
}

function initCityAutocomplete() {
    const input = document.getElementById('citySearchInput');
    if (!input) return;

    const ac = new google.maps.places.Autocomplete(input, {
        types: ['(cities)'],
        fields: ['name', 'geometry', 'address_components', 'formatted_address']
    });

    ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry) return;

        let countryCode = '';
        place.address_components?.forEach(c => {
            if (c.types.includes('country')) countryCode = c.short_name;
        });

        const cityData = {
            id: randomId(),
            name: place.name,
            country_code: countryCode,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            address: place.formatted_address
        };

        addLocation(cityData);
    });

    setCityAutocomplete(ac);
}

export function addLocation(city) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    
    if (!d.locations) d.locations = [];
    if (d.locations.some(l => l.name === city.name)) {
        alert('Esta cidade já está no seu dia!');
        return;
    }

    d.locations.push(city);
    saveData();
    closeModals();
    window.render();
    fetchWeather(); 
}

export function removeLocation(cityName) {
    if (!confirm(`Remover ${cityName}?`)) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.locations = d.locations.filter(l => l.name !== cityName);
    saveData();
    window.render();
}

// --- 2. PREVISÃO DO TEMPO INTELIGENTE (OPENWEATHER) ---
export async function fetchWeather() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const wd = document.getElementById('weatherDisplay');

    if (!wd) return;
    if (!d.locations || d.locations.length === 0) {
        wd.innerHTML = '<span class="text-gray-400 italic text-xs">Adicione uma localidade para ver a previsão.</span>';
        return;
    }

    // Lógica de Data: Verifica se o dia do roteiro está no alcance da API (5 dias)
    const today = new Date();
    today.setHours(0,0,0,0);
    const targetDate = d.date ? new Date(d.date + 'T00:00:00') : null;
    
    let isFar = false;
    if (targetDate) {
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 5) isFar = true;
        if (diffDays < 0) {
             wd.innerHTML = '<div class="p-2 text-xs text-gray-500 italic">📅 Este dia já passou.</div>';
             return;
        }
    }

    if (isFar) {
        wd.innerHTML = `<div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800">
            ⏳ <b>Previsão Indisponível:</b> O tempo para <b>${formatDateBr(d.date)}</b> só aparecerá aqui quando faltarem 5 dias para a data!
        </div>`;
        return;
    }

    wd.innerHTML = '<div class="p-2 text-xs text-blue-500 animate-pulse">🛰️ Consultando satélites...</div>';
    let finalHTML = '<div class="space-y-4">';

    for (const loc of d.locations) {
        if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY.includes('SUA_CHAVE')) {
            finalHTML += `<div class="text-[11px] text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">⚠️ Chave do OpenWeather não configurada.</div>`;
            continue;
        }

        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${loc.latitude}&lon=${loc.longitude}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const data = await res.json();
            
            // Filtra para mostrar apenas o dia correto do roteiro
            let forecasts = data.list;
            if (d.date) {
                forecasts = data.list.filter(f => f.dt_txt.startsWith(d.date));
            } else {
                forecasts = data.list.slice(0, 8); // Bucket list mostra próximas 24h
            }

            if (forecasts.length === 0) {
                finalHTML += `<div class="text-[11px] text-gray-500 p-2">🛰️ Dados ainda não disponíveis para esta data.</div>`;
                continue;
            }

            finalHTML += `
                <div class="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                    <div class="bg-blue-600 p-2 flex justify-between items-center">
                        <span class="text-white font-bold text-xs uppercase tracking-wider">🏙️ ${loc.name}</span>
                        <span class="text-blue-100 text-[10px]">${d.date ? formatDateBr(d.date) : 'Próximas 24h'}</span>
                    </div>
                    <div class="flex gap-2 overflow-x-auto p-3 bg-gradient-to-b from-blue-50 to-white scrollbar-hide">
                        ${forecasts.map(f => {
                            const time = f.dt_txt.split(' ')[1].substring(0, 5);
                            const temp = Math.round(f.main.temp);
                            const icon = f.weather[0].icon;
                            return `
                                <div class="flex flex-col items-center min-w-[65px] p-2 rounded-lg border border-blue-50 bg-white shadow-sm shrink-0">
                                    <span class="text-[10px] font-bold text-blue-400">${time}</span>
                                    <img src="https://openweathermap.org/img/wn/${icon}.png" class="w-10 h-10 -my-1">
                                    <span class="text-sm font-bold text-gray-800">${temp}°</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>`;
        } catch (err) {
            finalHTML += `<div class="text-[11px] text-red-500 bg-red-50 p-2 rounded border border-red-200">❌ Erro no OpenWeather para ${loc.name}.</div>`;
        }
    }

    finalHTML += '</div>';
    d.weather = finalHTML;
    wd.innerHTML = finalHTML;
    saveData();
}

// --- 3. ROTA COMPLETA DO DIA ---
export function openFullDayRoute() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const checkedIds = Array.from(document.querySelectorAll('.route-selector:checked')).map(el => el.value);
    let points = checkedIds.length > 0 ? d.attractions.filter(a => checkedIds.includes(String(a.id))) : d.attractions;
    const validPoints = points.filter(a => (a.latitude && a.longitude) || (a.address && a.address.length > 3));
    if (validPoints.length < 2) return alert('Selecione pelo menos 2 atrações!');
    const fmt = a => (a.latitude && a.longitude) ? `${a.latitude},${a.longitude}` : encodeURIComponent(a.address || a.name);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${fmt(validPoints[0])}&destination=${fmt(validPoints[validPoints.length - 1])}&waypoints=${validPoints.slice(1,-1).map(fmt).join('|')}&travelmode=walking`;
    window.open(url, '_blank');
}

// --- 4. RADAR GPS ---
export function openRadarModal() {
    const modal = document.getElementById('radarModal');
    if (modal) modal.classList.add('active');
}

export function scanRadar() {
    const btn = document.getElementById('btn-scan-radar');
    const list = document.getElementById('radarResultsList');
    if (!navigator.geolocation) return alert('GPS não disponível.');
    const oldText = btn.innerHTML;
    btn.innerHTML = '⏳ Mapeando satélites...';
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition((pos) => {
        const myLat = pos.coords.latitude;
        const myLng = pos.coords.longitude;
        const trip = appData.trips.find(x => x.id === currentState.tripId);
        let found = [];
        trip.days.forEach(day => {
            day.attractions.forEach(att => {
                if (att.latitude && att.longitude) {
                    const d = calcDist(myLat, myLng, parseFloat(att.latitude), parseFloat(att.longitude));
                    found.push({ ...att, dist: d, dayTitle: day.customTitle || 'Dia' });
                }
            });
        });
        found.sort((a, b) => a.dist - b.dist);
        list.innerHTML = (found.length ? found.map(f => `
            <li class="p-3 bg-white border rounded shadow-sm flex justify-between items-center border-indigo-200 mb-2">
                <div><b class="text-indigo-900 block text-sm">${f.name}</b></div>
                <div class="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">${f.dist >= 1 ? f.dist.toFixed(1) + ' km' : (f.dist * 1000).toFixed(0) + ' m'}</div>
            </li>`).join('') : '<li class="text-xs text-center p-4">Nenhuma atração com GPS encontrada.</li>');
        btn.innerHTML = oldText; btn.disabled = false;
    }, () => { btn.innerHTML = oldText; btn.disabled = false; });
}

function calcDist(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- 5. ROTAS INLINE ---
export function calcInlineRoute(aid) {
    const origin = document.getElementById(`origin-${aid}`)?.value;
    const mode = currentInlineModes[aid] || 'd';
    const trip = appData.trips.find(x => x.id === currentState.tripId);
    const day = trip.days.find(x => x.id === currentState.dayId);
    const att = day.attractions.find(x => x.id === aid);
    if (!origin) return alert('Digite um ponto de partida.');
    const travelMode = mode === 't' ? 'transit' : (mode === 'w' ? 'walking' : 'driving');
    const dest = encodeURIComponent(att.address || att.name);
    const url = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_API_KEY}&origin=${encodeURIComponent(origin)}&destination=${dest}&mode=${travelMode}`;
    const frame = document.getElementById(`map-frame-${aid}`);
    if (frame) { frame.src = url; document.getElementById(`map-container-${aid}`).classList.remove('hidden'); }
}

export function openGPSRoute(aid) {
    const trip = appData.trips.find(x => x.id === currentState.tripId);
    const day = trip.days.find(x => x.id === currentState.dayId);
    const att = day.attractions.find(x => x.id === aid);
    const mode = currentInlineModes[aid] || 'd';
    const travelMode = mode === 't' ? 'transit' : (mode === 'w' ? 'walking' : 'driving');
    const dest = (att.latitude && att.longitude) ? `${att.latitude},${att.longitude}` : encodeURIComponent(att.address || att.name);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${travelMode}`, '_blank');
}

export function useMyLocation(aid) {
    if (!navigator.geolocation) return;
    const btn = document.getElementById(`gps-btn-${aid}`);
    if (btn) btn.innerText = '⏳ Buscando...';
    navigator.geolocation.getCurrentPosition(pos => {
        const val = `${pos.coords.latitude},${pos.coords.longitude}`;
        const input = document.getElementById(`origin-${aid}`);
        if (input) input.value = val;
        if (btn) btn.innerText = '📍 Localizado';
    });
}

export function initOriginAutocomplete(aid) {
    const input = document.getElementById(`origin-${aid}`);
    if (input && window.google?.maps?.places && !input.dataset.ac) {
        input.dataset.ac = '1';
        new google.maps.places.Autocomplete(input);
    }
}