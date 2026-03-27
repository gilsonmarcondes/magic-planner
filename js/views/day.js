// --- VIEW: DAY (O Coração do Roteiro) ---
import { appData, currentState, currentInlineModes, saveData, setCurrentInlineModes, setCurrentState } from '../store.js';
import { formatDateBr, getDayName, closeModals } from '../utils.js';
import { CATEGORIES } from '../config.js';

export function renderDay(container, tripId, dayId) {
    if (tripId) setCurrentState({ tripId, dayId });
    const t = appData.trips.find(x => x.id === (tripId || currentState.tripId));
    const d = t?.days.find(x => x.id === (dayId || currentState.dayId));
    
    if (!d) return window.goTo('trip', t?.id);

    // --- 💰 CÁLCULO DE GASTOS DO DIA ---
    let totalDia = 0;
    (d.attractions || []).forEach(a => (a.costs || []).forEach(c => totalDia += Number(c.value || 0)));
    (d.transport || []).forEach(tr => totalDia += Number(tr.cost || 0));
    (d.extraCosts || []).forEach(ex => totalDia += Number(ex.value || 0));

    // --- 📜 MAPA DO MAROTO (EMBED) ---
    let marauderMapHtml = '';
    if (d.mapUrl) {
        const embedUrl = d.mapUrl.includes('google.com/maps/d/embed') 
            ? d.mapUrl 
            : d.mapUrl.replace(/\/viewer\?/, '/embed?').replace(/\/edit\?/, '/embed?');
        marauderMapHtml = `
            <div class="card mb-4 border-2 border-[#d4af37] overflow-hidden shadow-lg rounded-xl bg-white">
                <div onclick="window.toggleMarauderMap('${d.id}')" class="cursor-pointer bg-[#d4af37] text-white p-3 flex justify-between items-center hover:bg-[#b49020] transition select-none">
                    <span class="font-bold text-sm uppercase flex items-center gap-2">📜 Mapa do Maroto</span>
                    <span id="arrow-map-${d.id}" class="text-xl font-bold">▼</span>
                </div>
                <div id="map-container-${d.id}" class="hidden">
                    <iframe src="${embedUrl}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>
                    <div class="bg-gray-50 p-2 text-right border-t">
                        <button onclick="window.setMarauderMap('${d.id}')" class="text-[10px] text-blue-600 underline font-bold uppercase">✏️ Editar Link</button>
                    </div>
                </div>
            </div>`;
    } else {
        marauderMapHtml = `
            <div onclick="window.setMarauderMap('${d.id}')" class="card p-4 mb-4 border-2 border-dashed border-[#d4af37] bg-yellow-50 cursor-pointer hover:bg-yellow-100 flex items-center justify-center text-[#b45309] shadow-sm transition rounded-xl">
                <span class="text-xl mr-2">📜</span> <span class="font-bold text-xs uppercase tracking-widest">Adicionar Mapa do Dia</span>
            </div>`;
    }

    // --- 🏨 BADGES DE HOTEL ---
    let hotelsHtml = '';
    if (d.date) {
        t.hotels.forEach(h => {
            if (h.checkIn === d.date) hotelsHtml += `<div class="bg-green-100 border-l-4 border-green-500 text-green-800 p-2 mb-2 rounded text-[10px] font-bold shadow-sm uppercase">🛎️ Check-in: ${h.name}</div>`;
            else if (h.checkOut === d.date) hotelsHtml += `<div class="bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-2 mb-2 rounded text-[10px] font-bold shadow-sm uppercase">👋 Check-out: ${h.name}</div>`;
            else if (d.date > h.checkIn && d.date < h.checkOut) hotelsHtml += `<div class="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-2 mb-2 rounded text-[10px] font-bold shadow-sm uppercase">🛏️ Estadia: ${h.name}</div>`;
        });
    }

    // --- 📍 LOCALIDADES E CLIMA ---
    const locationsHtml = `
        <div class="card p-4 mb-4 border-l-4 border-l-green-400 bg-white shadow-sm rounded-xl">
            <details>
                <summary class="font-bold cursor-pointer text-green-700 flex items-center justify-between text-xs uppercase">
                    <span>📍 Cidades e Clima</span>
                    <span class="text-gray-300">▼</span>
                </summary>
                <div class="mt-4">
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${d.locations.map(l => `
                            <span class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold border uppercase">
                                ${l.name}
                                <button onclick="window.removeLocation('${l.name}')" class="text-red-400 font-bold">×</button>
                            </span>`).join('')}
                        <button onclick="window.openCitySearch()" class="text-[10px] bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 font-bold uppercase">+ Add</button>
                    </div>
                    <div class="border-t pt-3">
                        <button onclick="window.fetchWeather()" class="w-full bg-blue-50 text-blue-700 py-2 rounded-lg border border-blue-200 font-bold text-[10px] uppercase hover:bg-blue-100 transition">Sincronizar Previsão (Próximas 24h)</button>
                        <div id="weatherDisplay" class="mt-2">${d.weather || ''}</div>
                    </div>
                </div>
            </details>
        </div>`;

    // --- 🎫 TRANSPORTES ---
    const transportHtml = (d.transport || []).map(tr => {
        const typeIcons = { flight: '✈️', train: '🚆', bus: '🚌', car: '🚗' };
        const icon = typeIcons[tr.type] || '🎫';
        const displayTitle = (tr.origin && tr.dest) ? `${tr.origin} ➔ ${tr.dest}` : (tr.title || tr.ref || 'Transporte');
        const displayCost = !isNaN(parseFloat(tr.cost)) ? parseFloat(tr.cost).toFixed(2) : '0.00';
        
        return `
        <div id="attraction-${tr.id}" class="card p-4 border-l-8 border-l-blue-500 relative mb-4 attraction-item shadow-md bg-blue-50/30 rounded-xl" data-id="${tr.id}">
            <div class="flex justify-between items-start">
                <div class="flex gap-3 items-start w-full" onclick="window.toggleTicketContent('${tr.id}')">
                    <input type="checkbox" onclick="event.stopPropagation()" class="route-selector w-5 h-5 accent-blue-600 cursor-pointer mt-1" value="${tr.id}">
                    <div class="cursor-pointer w-full pr-2">
                        <h4 class="font-bold text-blue-900 uppercase text-[11px] flex items-center gap-2">${icon} ${displayTitle}</h4>
                        <div class="flex gap-3 mt-1">
                            <span class="text-[10px] bg-white px-2 py-0.5 rounded border border-blue-100 font-mono text-blue-600 shadow-sm">🕒 ${tr.depTime ? tr.depTime.split('T')[1] : '--:--'}</span>
                            <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">${tr.currency} ${displayCost} ${tr.paid ? '✅' : '⏳'}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-1 shrink-0">
                    <button onclick="window.openTransportModal('${tr.id}')" class="p-1 hover:bg-white rounded text-blue-600">✏️</button>
                    <button onclick="window.deleteTransport('${tr.id}')" class="p-1 text-red-400 hover:bg-white rounded font-bold">×</button>
                </div>
            </div>
            <div id="ticket-content-${tr.id}" class="hidden mt-4 pt-3 border-t border-blue-100 ml-8">
                ${(tr.steps || []).map(s => `<div class="text-[10px] text-slate-600 mb-1"><b>${s.time}</b> ${s.desc}</div>`).join('')}
                ${tr.notes ? `<div class="bg-white/80 p-3 rounded-lg border border-blue-100 text-[9px] font-mono text-gray-500 whitespace-pre-wrap mt-2">${tr.notes}</div>` : ''}
            </div>
        </div>`;
    }).join('');

    // --- 🏰 ATRAÇÕES ---
    const attractionsHtml = d.attractions.map(a => {
        const category = CATEGORIES[a.type] || CATEGORIES.other;
        const prio = (a.priority || 'standard').toLowerCase();
        let cardStyle = 'background-color:#ffffff;';
        if (prio === 'must_see') cardStyle = 'background-color:#fffbeb; border-color:#fcd34d;';
        
        return `
        <div id="attraction-${a.id}" class="attraction-item card p-4 border-l-8 relative mb-4 shadow-md bg-white rounded-xl transition-all" style="${cardStyle}" data-id="${a.id}">
            <div class="flex items-start gap-3">
                <input type="checkbox" onclick="event.stopPropagation()" class="route-selector w-5 h-5 accent-emerald-600 cursor-pointer mt-1" value="${a.id}">
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[9px] font-bold uppercase ${category.color} px-2 py-0.5 rounded-full border border-current">${category.icon} ${a.type}</span>
                                ${prio === 'must_see' ? '<span class="bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase shadow-sm">🌟 Imperdível</span>' : ''}
                            </div>
                            <h4 class="font-bold text-lg ${a.visited ? 'line-through text-gray-300' : 'text-[#0c4a6e]'}">${a.name}</h4>
                            <p class="text-[10px] text-gray-400 font-mono uppercase">🕒 ${a.hours || 'Livre'} | 📍 ${a.address || 'Sem endereço'}</p>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <div class="flex gap-2">
                                <button onclick="window.openAttractionModal('${a.id}')" class="p-1 hover:bg-gray-100 rounded">✏️</button>
                                <button onclick="window.deleteAttraction('${a.id}')" class="p-1 text-red-400 hover:bg-gray-100 rounded">×</button>
                            </div>
                            <button onclick="window.toggleVisited('${a.id}')" class="text-[9px] font-bold mt-1 ${a.visited ? 'text-green-700 bg-green-100' : 'text-gray-400 bg-white shadow-sm'} px-2 py-1 rounded-full border border-current transition-colors">
                                ${a.visited ? '✅ Feito' : '◻ A Fazer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <details class="text-sm mt-3 ml-8 border-t border-dashed pt-2 border-gray-100">
                <summary class="font-bold text-gray-400 cursor-pointer text-[9px] uppercase tracking-widest">Ver Detalhes & GPS</summary>
                <div class="mt-2 p-3 bg-gray-50/50 rounded-lg text-slate-600 text-xs">${a.desc || 'Sem notas...'}</div>
                <div class="mt-4 flex gap-2">
                    <button onclick="window.calcInlineRoute('${a.id}')" class="bg-indigo-600 text-white text-[9px] font-bold py-2 px-3 rounded flex-1 shadow uppercase">Mapa Interno</button>
                    <button onclick="window.openGPSRoute('${a.id}')" class="bg-emerald-600 text-white text-[9px] font-bold py-2 px-3 rounded flex-1 shadow uppercase">Abrir GPS</button>
                </div>
            </details>
        </div>`;
    }).join('');

    // --- 🏁 MONTAGEM DO HTML FINAL ---
    const dayIndex = t.days.findIndex(x => x.id === d.id);
    container.innerHTML = `
        <div class="sticky top-0 bg-[#fffef0]/95 backdrop-blur-md z-20 py-2 border-b border-gray-200 px-4">
            <div class="flex items-center justify-between mb-2">
                <button onclick="window.goTo('trip','${t.id}')" class="bg-white border px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm text-slate-600 hover:bg-gray-50 transition">⬅ Voltar</button>
                <div class="text-center flex-1 mx-2">
                    <h2 class="text-lg font-bold text-[#0c4a6e] truncate">${d.customTitle || 'Dia ' + (dayIndex + 1)}</h2>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${d.date ? formatDateBr(d.date) + ' • ' + getDayName(d.date) : ''}</p>
                </div>
                <button onclick="window.renameDay()" class="text-slate-300 hover:text-blue-500">✏️</button>
            </div>
            
            <div class="bg-[#0c4a6e] text-white p-2 rounded-xl shadow-lg text-center mb-3 flex justify-between items-center px-4">
                <span class="text-[9px] uppercase font-bold text-blue-200">Gasto Total do Dia</span>
                <span class="text-lg font-bold font-mono">R$ ${totalDia.toFixed(2)}</span>
            </div>

            <div class="flex flex-wrap gap-2 justify-center pb-2">
                <button onclick="window.openFullDayRoute()" class="bg-emerald-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md uppercase">🗺️ Rota Total</button>
                <button onclick="window.openRadarModal()" class="bg-indigo-400 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md uppercase">📡 Radar</button>
                <button onclick="window.openAttractionModal()" class="bg-indigo-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md uppercase">+ Atração</button>
                <button onclick="window.openTransportModal()" class="bg-blue-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md uppercase">+ Bilhete</button>
                <button onclick="window.openDayExtraModal()" class="bg-amber-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md uppercase">+ Extra</button>
                
                <button onclick="window.generateDayPDF(event)" class="bg-white text-red-600 border border-red-200 text-[10px] font-bold px-3 py-2 rounded-lg shadow-sm uppercase">📄 PDF</button>
                <button onclick="window.openBatchMoveCopy()" class="bg-purple-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md uppercase">🔄 Mover</button>
                <button id="btnSortPrio" onclick="window.sortAttractionsByPriority()" class="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-2 rounded-lg shadow-md uppercase">🌪️ Ordenar</button>
            </div>
        </div>
        
        <div class="max-w-4xl mx-auto py-4 px-4 pb-24">
            ${marauderMapHtml}
            ${hotelsHtml}
            ${locationsHtml}
            <div id="attractionsContainer">${transportHtml}${attractionsHtml}</div>
            
            <div class="mt-8 border-t pt-4">
                <details class="bg-orange-50/50 p-4 rounded-xl border border-orange-100 shadow-sm">
                    <summary class="font-bold cursor-pointer text-orange-700 flex justify-between items-center text-xs uppercase">
                        <span>💸 Gastos Extras</span>
                        <span class="bg-orange-100 px-2 rounded-full font-mono text-[10px]">${d.extraCosts.length}</span>
                    </summary>
                    <div class="mt-4 space-y-2">
                        ${d.extraCosts.map((ex, i) => `
                            <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-orange-100 shadow-sm">
                                <div class="flex flex-col">
                                    <span class="font-bold text-slate-700 uppercase text-[9px]">${ex.desc}</span>
                                    <span class="text-xs font-mono text-orange-600 font-bold">${ex.currency} ${parseFloat(ex.value).toFixed(2)}</span>
                                </div>
                                <button onclick="window.deleteDayExtra(${i})" class="text-red-300 hover:text-red-500 font-bold text-xl leading-none">×</button>
                            </div>`).join('')}
                    </div>
                </details>
            </div>
        </div>`;

    // Ativa o Drag & Drop
    new Sortable(document.getElementById('attractionsContainer'), {
        animation: 150, handle: '.attraction-item', delay: 300, delayOnTouchOnly: true,
        dataIdAttr: 'data-id', onEnd: () => updateAttractionOrder(document.querySelectorAll('#attractionsContainer .attraction-item')),
    });
}

// --- FUNÇÕES DE APOIO (LÓGICA INTACTA) ---

function updateAttractionOrder(nodeList) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const ids = Array.from(nodeList).map(el => el.getAttribute('data-id'));
    const combined = [...(d.transport || []), ...d.attractions];
    const newAtt = [], newTrans = [];
    ids.forEach(id => {
        const item = combined.find(i => String(i.id) === String(id));
        if (item) {
            const isTransport = (d.transport || []).some(tr => String(tr.id) === String(id));
            if (isTransport) newTrans.push(item); else newAtt.push(item);
        }
    });
    d.attractions = newAtt; d.transport = newTrans;
    saveData();
}

export function renameDay() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const newTitle = prompt('Título do dia:', d.customTitle || '');
    if (newTitle !== null) { d.customTitle = newTitle.trim(); saveData(); window.render(); }
}

export function toggleVisited(aid) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = d.attractions.find(x => String(x.id) === String(aid));
    if (a) { a.visited = !a.visited; saveData(); window.render(); }
}

export function deleteAttraction(id) {
    if (!confirm('Excluir esta atração?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.attractions = d.attractions.filter(a => String(a.id) !== String(id));
    saveData(); window.render();
}

export function setInlineMode(id, mode) {
    currentInlineModes[id] = mode;
    setCurrentInlineModes(currentInlineModes);
    ['d', 't', 'w'].forEach(m => {
        const btn = document.getElementById(`mode-${m}-${id}`);
        if (btn) btn.className = m === mode ? 'flex-1 border rounded-lg p-2 text-[10px] font-bold bg-blue-100 border-blue-500 shadow-sm' : 'flex-1 border rounded-lg p-2 text-[10px] font-bold bg-white border-gray-200 shadow-sm';
    });
}

export function toggleTicketContent(id) {
    const content = document.getElementById(`ticket-content-${id}`);
    const arrow = document.getElementById(`arrow-${id}`);
    if (content) {
        const isHidden = content.classList.contains('hidden');
        content.classList.toggle('hidden');
        if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

export function toggleMarauderMap(dayId) {
    const container = document.getElementById(`map-container-${dayId}`);
    const arrow = document.getElementById(`arrow-map-${dayId}`);
    if (container) {
        const isHidden = container.classList.contains('hidden');
        container.classList.toggle('hidden', !isHidden);
        if (arrow) arrow.innerText = isHidden ? '▲' : '▼';
    }
}

export function setMarauderMap(dayId) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === dayId);
    const url = prompt('Link do Google My Maps (Embed):', d.mapUrl || '');
    if (url !== null) { d.mapUrl = url; saveData(); window.render(); }
}

export function deleteDayExtra(index) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.extraCosts.splice(index, 1); saveData(); window.render();
}

export function openBatchMoveCopy() {
    const checks = document.querySelectorAll('.route-selector:checked');
    if (checks.length === 0) return alert('Selecione os itens primeiro.');
    setCurrentBatchIds(Array.from(checks).map(c => c.value));
    window.prepareMoveModal(`Mover/Copiar ${checks.length} Itens`);
}

export function sortAttractionsByPriority() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t?.days.find(x => x.id === currentState.dayId);
    if (!d || !d.attractions?.length) return;
    const w = { must_see: 1, photo: 2, maybe: 3, standard: 4 };
    d.attractions.sort((a, b) => (w[a.priority] || 4) - (w[b.priority] || 4));
    saveData(); window.render();
}

export function toggleSelectAllAttractions() {
    const checks = document.querySelectorAll('.route-selector');
    const allChecked = Array.from(checks).every(c => c.checked);
    checks.forEach(c => c.checked = !allChecked);
}