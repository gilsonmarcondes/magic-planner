// --- VIEW: DAY ---
import { appData, currentState, currentInlineModes, saveData, setCurrentInlineModes, setCurrentState } from '../store.js';
import { formatDateBr, getDayName, closeModals } from '../utils.js';
import { CATEGORIES } from '../config.js';

export function renderDay(container, tripId, dayId) {
    if (tripId) setCurrentState({ tripId, dayId });
    const t = appData.trips.find(x => x.id === (tripId || currentState.tripId));
    const d = t?.days.find(x => x.id === (dayId || currentState.dayId));
    if (!d) return window.goTo('trip', t?.id);

    let totalDia = 0;
    d.attractions.forEach(a => (a.costs || []).forEach(c => totalDia += Number(c.value || 0)));
    (d.transport || []).forEach(tr => totalDia += Number(tr.cost || 0));
    (d.extraCosts || []).forEach(ex => totalDia += Number(ex.value || 0));

    let marauderMapHtml = '';
    if (d.mapUrl) {
        const embedUrl = d.mapUrl.includes('google.com/maps/d/embed') ? d.mapUrl : d.mapUrl.replace('/viewer?', '/embed?').replace('/edit?', '/embed?');
        marauderMapHtml = `
            <div class="card mb-4 border-2 border-[#d4af37] overflow-hidden shadow-lg rounded-lg bg-white">
                <div onclick="window.toggleMarauderMap('${d.id}')" class="cursor-pointer bg-[#d4af37] text-white p-3 flex justify-between items-center hover:bg-[#b49020] transition">
                    <span class="font-bold text-sm uppercase flex items-center gap-2">📜 Mapa do Maroto</span>
                    <span id="arrow-map-${d.id}" class="text-xl font-bold">▼</span>
                </div>
                <div id="map-container-${d.id}" class="hidden">
                    <iframe src="${embedUrl}" width="100%" height="550" frameborder="0" allowfullscreen></iframe>
                    <div class="bg-gray-50 p-2 text-right border-t">
                        <button onclick="window.setMarauderMap('${d.id}')" class="text-xs text-blue-600 underline font-bold">✏️ Editar Link</button>
                    </div>
                </div>
            </div>`;
    } else {
        marauderMapHtml = `<div onclick="window.setMarauderMap('${d.id}')" class="card p-4 mb-4 border-2 border-dashed border-[#d4af37] bg-yellow-50 cursor-pointer flex items-center justify-center text-[#b45309] rounded-lg shadow-sm font-bold uppercase text-xs">📜 Adicionar Mapa do Dia</div>`;
    }

    const transportHtml = (d.transport || []).map(tr => {
        const typeIcons = { flight: '✈️', train: '🚆', bus: '🚌', car: '🚗' };
        const icon = typeIcons[tr.type] || '🎫';
        const displayTitle = (tr.origin && tr.dest) ? `${tr.origin} ➔ ${tr.dest}` : (tr.ref || 'Novo Bilhete');
        const displayCost = !isNaN(parseFloat(tr.cost)) ? parseFloat(tr.cost).toFixed(2) : '0.00';

        return `
        <div id="attraction-${tr.id}" class="card p-4 border-l-8 border-l-blue-500 relative mb-4 attraction-item shadow-md bg-blue-50/50 rounded-lg" data-id="${tr.id}">
            <div class="flex justify-between items-start">
                <div class="flex gap-2 items-start w-full" onclick="window.toggleTicketContent('${tr.id}')">
                    <div class="pt-1 shrink-0"><input type="checkbox" onclick="event.stopPropagation()" class="route-selector w-5 h-5 accent-blue-600 cursor-pointer" value="${tr.id}"></div>
                    <div class="cursor-pointer flex items-center justify-between w-full">
                        <div>
                            <h4 class="font-bold text-blue-900 uppercase text-[11px]">${icon} ${displayTitle}</h4>
                            <div class="flex gap-2 mt-1">
                                <span class="text-[10px] font-bold text-emerald-600 uppercase font-mono">${tr.currency || 'USD'} ${displayCost} ${tr.paid ? '✅' : '⏳'}</span>
                            </div>
                        </div>
                        <span id="arrow-${tr.id}" class="text-blue-400">▼</span>
                    </div>
                </div>
                <div class="flex gap-2 shrink-0 ml-1">
                    <button onclick="window.openTransportModal('${tr.id}')" class="p-1 hover:bg-white rounded text-blue-600">✏️</button>
                    <button onclick="window.deleteTransport('${tr.id}')" class="p-1 text-red-400 hover:bg-white rounded font-bold">×</button>
                </div>
            </div>
            <div id="ticket-content-${tr.id}" class="hidden mt-4 pt-3 border-t border-blue-100">
                <div class="space-y-2 mb-3 ml-6">
                    ${(tr.steps || []).map(s => {
                        const sIcons = { walk: '🚶', tube: '🚇', train: '🚆', bus: '🚌', car: '🚗', flight: '✈️' };
                        return `<div class="text-[11px] text-slate-600 flex items-center gap-2"><span>${sIcons[s.mode] || '📍'}</span><span class="font-bold text-blue-800 w-12 font-mono">${s.time || ''}</span><span>${s.desc}</span></div>`;
                    }).join('')}
                </div>
                ${tr.notes ? `<div class="bg-white p-3 rounded-lg border text-[10px] font-mono text-gray-500 whitespace-pre-wrap ml-6">${tr.notes}</div>` : ''}
            </div>
        </div>`;
    }).join('');

    const attractionsHtml = d.attractions.map(a => {
        const category = CATEGORIES[a.type] || CATEGORIES.other;
        let cardStyle = 'background-color:#ffffff; border:1px solid #e2e8f0;';
        const prio = (a.priority || 'standard').toLowerCase().trim();
        if (prio === 'must_see' || prio === 'imperdivel') cardStyle = 'background-color:#fef3c7; border:1px solid #fcd34d;';
        else if (prio === 'photo') cardStyle = 'background-color:#fdf4ff; border:1px solid #f5d0fe;';

        return `
        <div id="attraction-${a.id}" class="attraction-item card p-4 border-l-8 relative mb-4 shadow-md bg-white rounded-lg" style="${cardStyle}" data-id="${a.id}">
            <div class="flex items-start gap-3">
                <input type="checkbox" onclick="event.stopPropagation()" class="route-selector w-5 h-5 accent-emerald-600 cursor-pointer" value="${a.id}">
                <div class="flex-1">
                    <div class="flex justify-between">
                        <h4 class="font-bold text-lg ${a.visited ? 'line-through text-gray-400' : 'text-[#0c4a6e]'}">${a.name}</h4>
                        <div class="flex gap-2">
                            <button onclick="window.openAttractionModal('${a.id}')">✏️</button>
                            <button onclick="window.deleteAttraction('${a.id}')">×</button>
                        </div>
                    </div>
                    <p class="text-[10px] text-gray-400 uppercase font-mono mt-1">🕒 ${a.hours || 'Livre'} | 📍 ${a.address || ''}</p>
                </div>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = `
        <div class="sticky top-0 bg-[#fffef0]/95 backdrop-blur-md z-20 py-2 border-b border-gray-200 px-4">
            <div class="flex items-center justify-between mb-2">
                <button onclick="window.goTo('trip','${t.id}')" class="bg-white border px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">⬅ Voltar</button>
                <div class="text-center flex-1 mx-2">
                    <h2 class="text-lg font-bold text-[#0c4a6e]">${d.customTitle || 'Dia'}</h2>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${d.date ? formatDateBr(d.date) : ''}</p>
                </div>
                <button onclick="window.renameDay()" class="text-slate-300">✏️</button>
            </div>
            <div class="bg-[#0c4a6e] text-white p-2 rounded-xl shadow-lg text-center mb-3 flex justify-between items-center px-4">
                <span class="text-[9px] uppercase font-bold text-blue-200">Gasto do Dia</span>
                <span class="text-lg font-bold font-mono">R$ ${totalDia.toFixed(2)}</span>
            </div>
            <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button onclick="window.openAttractionModal()" class="bg-indigo-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md shrink-0">+ ATRAÇÃO</button>
                <button onclick="window.openTransportModal()" class="bg-blue-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md shrink-0">+ BILHETE</button>
                <button onclick="window.openDayExtraModal()" class="bg-amber-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md shrink-0">+ EXTRA</button>
            </div>
        </div>
        <div class="max-w-4xl mx-auto py-4 px-4 pb-24">
            ${marauderMapHtml}
            <div id="attractionsContainer">${transportHtml}${attractionsHtml}</div>
        </div>`;
}

// --- FUNÇÕES EXPORTADAS (Sem duplicidade!) ---
export function renameDay() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const newTitle = prompt('Novo título do dia:', d.customTitle || '');
    if (newTitle !== null) { d.customTitle = newTitle.trim(); saveData(); window.render(); }
}

export function toggleVisited(aid) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = d.attractions.find(x => String(x.id) === String(aid));
    if (a) { a.visited = !a.visited; saveData(); window.render(); }
}

export function deleteAttraction(id) {
    if (!confirm('Deseja realmente apagar esta atração?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.attractions = d.attractions.filter(a => String(a.id) !== String(id));
    saveData(); window.render();
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
    const d = t.days.find(x => x.id === dayId); if (!d) return;
    const url = prompt('Link do Google My Maps:', d.mapUrl || '');
    if (url !== null) { d.mapUrl = url; saveData(); window.render(); }
}

export function deleteDayExtra(index) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.extraCosts.splice(index, 1); saveData(); window.render();
}

export function sortAttractionsByPriority() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t?.days.find(x => x.id === currentState.dayId);
    if (!d) return;
    const w = { must_see: 1, imperdivel: 1, photo: 2, foto: 2, maybe: 3, se_der: 3, standard: 4, padrao: 4 };
    d.attractions.sort((a, b) => (w[a.priority] || 4) - (w[b.priority] || 4));
    saveData(); window.render();
}

// Funções de Mapa Inline (Apenas esqueleto para o main.js não quebrar)
export function setInlineMode() {}
export function toggleRoutePanel() {}
export function openBatchMoveCopy() {}
export function toggleSelectAllAttractions() {}