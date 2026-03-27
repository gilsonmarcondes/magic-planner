// --- VIEW: DAY ---
import { appData, currentState, currentInlineModes, saveData, setCurrentInlineModes, setCurrentState } from '../store.js';
import { formatDateBr, getDayName, closeModals } from '../utils.js';
import { CATEGORIES } from '../config.js';

export function renderDay(container, tripId, dayId) {
    if (tripId) setCurrentState({ tripId, dayId });
    const t = appData.trips.find(x => x.id === (tripId || currentState.tripId));
    const d = t?.days.find(x => x.id === (dayId || currentState.dayId));
    if (!d) return window.goTo('trip', t?.id);

    // --- Totais do dia (Seguro contra NaN) ---
    let totalDia = 0;
    (d.attractions || []).forEach(a => (a.costs || []).forEach(c => totalDia += Number(c.value || 0)));
    (d.transport || []).forEach(tr => totalDia += Number(tr.cost || 0));
    (d.extraCosts || []).forEach(ex => totalDia += Number(ex.value || 0));

    // --- Mapa do Maroto ---
    let marauderMapHtml = '';
    if (d.mapUrl) {
        const embedUrl = d.mapUrl.includes('google.com/maps/d/embed') 
            ? d.mapUrl 
            : d.mapUrl.replace(/\/viewer\?/, '/embed?').replace(/\/edit\?/, '/embed?');
        marauderMapHtml = `
            <div class="card mb-4 border-2 border-[#d4af37] overflow-hidden shadow-lg rounded-lg bg-white">
                <div onclick="window.toggleMarauderMap('${d.id}')" class="cursor-pointer bg-[#d4af37] text-white p-3 flex justify-between items-center hover:bg-[#b49020] transition select-none">
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
        marauderMapHtml = `
            <div onclick="window.setMarauderMap('${d.id}')" class="card p-4 mb-4 border-2 border-dashed border-[#d4af37] bg-yellow-50 cursor-pointer hover:bg-yellow-100 flex items-center justify-center text-[#b45309] shadow-sm transition rounded-lg">
                <span class="text-xl mr-2">📜</span> <span class="font-bold text-sm uppercase">Adicionar Mapa do Dia</span>
            </div>`;
    }

    // --- Badges de hotel ---
    let hotelsHtml = '';
    if (d.date) {
        t.hotels.forEach(h => {
            if      (h.checkIn  === d.date) hotelsHtml += `<div class="bg-green-100 border-l-4 border-green-500 text-green-800 p-2 mb-2 rounded text-xs font-bold shadow-sm">🛎️ Check-in: ${h.name}</div>`;
            else if (h.checkOut === d.date) hotelsHtml += `<div class="bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-2 mb-2 rounded text-xs font-bold shadow-sm">👋 Check-out: ${h.name}</div>`;
            else if (d.date > h.checkIn && d.date < h.checkOut) hotelsHtml += `<div class="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-2 mb-2 rounded text-xs font-bold shadow-sm">🛏️ Estadia: ${h.name}</div>`;
        });
    }

    // --- Localidades ---
    const locationsHtml = `
        <div class="card p-4 mb-4 border-l-4 border-l-green-400 bg-white shadow-sm rounded-lg">
            <details>
                <summary class="font-bold cursor-pointer text-green-700 flex items-center gap-2">📍 Destinos / Clima</summary>
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] font-bold text-gray-400 uppercase">Cidades:</span>
                        <button onclick="window.openCitySearch()" class="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-bold uppercase">Adicionar</button>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-3 font-bold uppercase">
                        ${d.locations.map(l => `
                            <span class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] border">
                                ${l.name}
                                <button onclick="window.removeLocation('${l.name}')" class="text-red-400 font-bold">×</button>
                            </span>`).join('')}
                    </div>
                    <div class="border-t pt-3">
                        <button onclick="window.fetchWeather()" class="w-full bg-blue-50 text-blue-700 py-2 rounded-lg border border-blue-200 font-bold text-xs uppercase mb-2 hover:bg-blue-100 transition">Sincronizar Previsão (24h)</button>
                        <div id="weatherDisplay">${d.weather || '<p class="text-[10px] text-gray-400 text-center italic">Nenhuma previsão carregada</p>'}</div>
                    </div>
                </div>
            </details>
        </div>`;

    // --- Transportes (BILHETE CORRIGIDO NÍVEL HARRY POTTER) ---
    const transportHtml = (d.transport || []).map(tr => {
        const typeIcons = { flight: '✈️', train: '🚆', bus: '🚌', car: '🚗' };
        const icon = typeIcons[tr.type] || '🎫';
        
        // Título inteligente e Custo seguro
        const displayTitle = (tr.origin && tr.dest) ? `${tr.origin} ➔ ${tr.dest}` : (tr.title || tr.ref || 'Novo Bilhete');
        const displayCost = !isNaN(parseFloat(tr.cost)) ? parseFloat(tr.cost).toFixed(2) : '0.00';
        
        const depTime = tr.depTime ? tr.depTime.split('T')[1] : '--:--';
        const arrTime = tr.arrTime ? tr.arrTime.split('T')[1] : '--:--';

        return `
        <div id="attraction-${tr.id}" class="card p-4 border-l-8 border-l-blue-500 relative mb-4 attraction-item shadow-md bg-blue-50/50 rounded-lg" data-id="${tr.id}">
            <div class="flex justify-between items-start">
                <div class="flex gap-2 items-start w-full">
                    <div class="pt-1 shrink-0">
                        <input type="checkbox" onclick="event.stopPropagation()" class="route-selector w-5 h-5 accent-blue-600 cursor-pointer" value="${tr.id}">
                    </div>
                    <div onclick="window.toggleTicketContent('${tr.id}')" class="cursor-pointer flex items-center justify-between w-full pr-2">
                        <div>
                            <h4 class="font-bold text-blue-900 uppercase text-[11px] flex items-center gap-2">
                                ${icon} ${displayTitle}
                            </h4>
                            <div class="flex gap-3 mt-1">
                                <span class="text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200 font-mono text-blue-700 shadow-sm">🕒 ${depTime} - ${arrTime}</span>
                                <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">${tr.currency || 'USD'} ${displayCost} ${tr.paid ? '✅' : '⏳'}</span>
                            </div>
                        </div>
                        <span id="arrow-${tr.id}" class="text-blue-400 transition-transform duration-300">▼</span>
                    </div>
                </div>
                <div class="flex gap-1 shrink-0 ml-1">
                    <button onclick="window.openTransportModal('${tr.id}')" class="p-1 hover:bg-white rounded text-blue-600">✏️</button>
                    <button onclick="window.deleteTransport('${tr.id}')" class="p-1 text-red-400 hover:bg-white rounded font-bold">×</button>
                </div>
            </div>
            
            <div id="ticket-content-${tr.id}" class="hidden mt-4 pt-3 border-t border-blue-100">
                <div class="space-y-2 mb-3 ml-6">
                    ${(tr.steps || []).map(s => {
                        const sIcons = { walk: '🚶', tube: '🚇', train: '🚆', bus: '🚌', car: '🚗', flight: '✈️' };
                        return `
                        <div class="text-[11px] text-slate-600 flex items-start gap-2">
                            <span class="bg-white rounded-full p-0.5 border border-blue-100 mt-0.5">${sIcons[s.mode] || '📍'}</span>
                            <span class="font-bold text-blue-800 w-12 font-mono mt-0.5">${s.time || '--:--'}</span>
                            <span class="flex-1 leading-tight">${s.desc}</span>
                        </div>`;
                    }).join('')}
                </div>
                ${tr.notes ? `
                    <div class="bg-white/80 p-3 rounded-lg border border-blue-100 text-[10px] font-mono text-gray-500 whitespace-pre-wrap leading-relaxed shadow-inner ml-6">
                        <p class="uppercase font-bold text-[8px] text-blue-400 mb-2 border-b border-blue-50 pb-1">📋 Notas Detalhadas</p>
                        ${tr.notes}
                    </div>` : ''}
            </div>
        </div>`;
    }).join('');

    // --- Atrações ---
    const attractionsHtml = d.attractions.map(a => {
        const category = CATEGORIES[a.type] || CATEGORIES.other;
        let cardStyle = 'background-color:#ffffff; border:1px solid #e2e8f0;';
        let priorityBadge = '';
        const prio = (a.priority || 'standard').toLowerCase().trim();
        
        if (prio === 'must_see' || prio === 'imperdivel') { 
            cardStyle = 'background-color:#fef3c7; border:1px solid #fcd34d;'; 
            priorityBadge = '<span class="bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded ml-2 shadow-sm uppercase">🌟 Imperdível</span>'; 
        } else if (prio === 'photo') { 
            cardStyle = 'background-color:#fdf4ff; border:1px solid #f5d0fe;'; 
            priorityBadge = '<span class="bg-fuchsia-500 text-white text-[8px] font-bold px-2 py-0.5 rounded ml-2 shadow-sm uppercase">📸 Só Foto</span>'; 
        } else if (prio === 'maybe') { 
            cardStyle = 'background-color:#f1f5f9; border:1px solid #e2e8f0; opacity:0.9;'; 
            priorityBadge = '<span class="bg-slate-500 text-white text-[8px] font-bold px-2 py-0.5 rounded ml-2 uppercase tracking-tighter">⏳ Se Der</span>'; 
        }

        // BALÃOZINHO DE NÚMERO ADICIONADO!
        const numBadge = a.mapNum ? `<span class="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm shrink-0 border border-red-700 mt-1">${a.mapNum}</span>` : '';
        const subHtml = a.subtitle ? `<p class="text-xs text-gray-500 italic font-serif -mt-0.5 mb-1">"${a.subtitle}"</p>` : '';

        const images = (a.photos?.length > 0) ? a.photos : [];
        const galleryHtml = images.length > 0
            ? `<div class="flex gap-3 overflow-x-auto pb-3 mb-3 no-scrollbar">${images.map(src => `<img src="${src}" onclick="window.open('${src}','_blank')" class="h-48 min-w-[200px] object-cover rounded-lg shadow-md border shrink-0 cursor-zoom-in" onerror="this.style.display='none'">`).join('')}</div>`
            : '';

        return `
        <div id="attraction-${a.id}" class="attraction-item card p-4 border-l-8 relative mb-4 shadow-md bg-white rounded-lg transition-all" style="${cardStyle}" data-id="${a.id}">
            ${galleryHtml}
            <div class="flex items-start gap-3 mb-2">
                <div class="pt-1 shrink-0">
                    <input type="checkbox" onclick="event.stopPropagation()" class="route-selector w-5 h-5 accent-emerald-600 cursor-pointer" value="${a.id}">
                </div>
                <div class="flex-1 w-full">
                    <div class="flex justify-between items-start">
                        <div class="flex gap-3 w-full">
                            ${numBadge}
                            <div class="flex-1">
                                <div class="flex items-center mb-1">
                                    <span class="text-[10px] font-bold uppercase ${category.color} px-2 py-1 rounded-full border border-current">${category.icon} ${a.type}</span>
                                    ${priorityBadge}
                                </div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <h4 class="font-bold text-lg mt-1 ${a.visited ? 'line-through text-gray-400' : 'text-[#0c4a6e]'} leading-tight">${a.name}</h4>
                                    <button onclick="window.quickShowHistory('${a.id}')" class="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full shadow-sm hover:bg-blue-50">📖 Curiosidades</button>
                                </div>
                                ${subHtml}
                                <p class="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-mono uppercase tracking-tighter">🕒 ${a.hours || 'Livre'} | 📍 ${a.address || 'Sem endereço'}</p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1 shrink-0 ml-1">
                            <div class="flex gap-2">
                                <button onclick="window.openAttractionModal('${a.id}')" class="p-1 hover:bg-gray-100 rounded">✏️</button>
                                <button onclick="window.deleteAttraction('${a.id}')" class="p-1 text-red-400 hover:bg-gray-100 rounded font-bold">×</button>
                            </div>
                            <button onclick="window.toggleVisited('${a.id}')" class="text-[10px] font-bold mt-1 ${a.visited ? 'text-green-700 bg-green-200 border-green-300' : 'text-gray-500 bg-white border-gray-200 shadow-sm'} px-2 py-1 rounded-full border transition-colors">
                                ${a.visited ? '✅ Feito' : '◻ A Fazer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <details class="text-sm mt-2 ml-8 border-t border-dashed pt-2 border-gray-100">
                <summary class="font-bold text-gray-400 cursor-pointer text-[10px] uppercase tracking-widest">Informações & Rota GPS</summary>
                <div class="mt-2 p-3 bg-gray-50/50 rounded-lg prose prose-sm max-w-none text-slate-600">${a.desc || 'Sem descrição adicional...'}</div>
                
                <div class="mt-4 p-3 bg-white border rounded-xl shadow-inner">
                    <p class="text-[10px] font-bold text-blue-800 uppercase mb-3">🧭 Traçar Rota</p>
                    <div class="mb-2">
                        <button id="gps-btn-${a.id}" onclick="window.useMyLocation('${a.id}')" class="w-full bg-blue-50 text-blue-700 py-2 rounded-lg border border-blue-200 text-xs mb-2 font-bold hover:bg-blue-100 transition">📍 Usar minha localização</button>
                        <input id="origin-${a.id}" placeholder="Origem: Estação, Hotel..." class="w-full p-2 border rounded-lg text-xs font-mono shadow-sm mb-3" onfocus="window.initOriginAutocomplete('${a.id}')">
                    </div>
                    <div class="flex justify-between gap-1 mb-3">
                        <button id="mode-d-${a.id}" onclick="window.setInlineMode('${a.id}','d')" class="flex-1 border rounded-lg p-2 text-[10px] font-bold shadow-sm transition-all">🚗 Carro</button>
                        <button id="mode-t-${a.id}" onclick="window.setInlineMode('${a.id}','t')" class="flex-1 border rounded-lg p-2 text-[10px] font-bold shadow-sm transition-all">🚌 Transp.</button>
                        <button id="mode-w-${a.id}" onclick="window.setInlineMode('${a.id}','w')" class="flex-1 border rounded-lg p-2 text-[10px] font-bold shadow-sm transition-all">🚶 A pé</button>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.calcInlineRoute('${a.id}')" class="bg-indigo-600 text-white text-[10px] font-bold py-2 px-4 rounded-lg flex-1 shadow-md hover:bg-indigo-700 uppercase">Mapa Interno</button>
                        <button onclick="window.openGPSRoute('${a.id}')" class="bg-emerald-600 text-white text-[10px] font-bold py-2 px-4 rounded-lg flex-1 shadow-md hover:bg-emerald-700 uppercase">Abrir GPS</button>
                    </div>
                    <div id="map-container-${a.id}" class="hidden mt-3 border rounded-xl h-[400px] overflow-hidden shadow-lg">
                        <iframe id="map-frame-${a.id}" width="100%" height="100%" frameborder="0"></iframe>
                    </div>
                </div>
            </details>
        </div>`;
    }).join('');

    const subtitleHtml = d.subtitle ? `<p class="text-xs text-gray-400 italic text-center -mt-1 mb-2">"${d.subtitle}"</p>` : '';
    const dayIndex = t.days.findIndex(x => x.id === d.id);

    container.innerHTML = `
        <div class="sticky top-0 bg-[#fffef0]/95 backdrop-blur-md z-20 py-2 border-b border-gray-200 px-4">
            <div class="flex items-center justify-between mb-2">
                <button onclick="window.goTo('trip','${t.id}')" class="bg-white border px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm text-slate-600 hover:bg-gray-50 transition">⬅ Voltar</button>
                <div class="text-center flex-1 mx-2">
                    <h2 class="text-lg font-bold text-[#0c4a6e] truncate">${d.customTitle || 'Dia ' + (dayIndex + 1)}</h2>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${d.date ? formatDateBr(d.date) + ' • ' + getDayName(d.date) : ''}</p>
                    ${subtitleHtml}
                </div>
                <button onclick="window.renameDay()" class="text-slate-300 hover:text-blue-500">✏️</button>
            </div>
            <div class="bg-[#0c4a6e] text-white p-2 rounded-xl shadow-lg text-center mb-3 flex justify-between items-center px-4">
                <span class="text-[9px] uppercase font-bold text-blue-200">Gasto Total do Dia</span>
                <span class="text-lg font-bold font-mono">R$ ${totalDia.toFixed(2)}</span>
            </div>
            <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button onclick="window.openFullDayRoute()" class="bg-emerald-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-md shrink-0 uppercase tracking-tighter font-mono">🗺️ Rota Geral</button>
                <button onclick="window.openAttractionModal()" class="bg-indigo-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-md shrink-0 uppercase tracking-tighter">+ Atração</button>
                <button onclick="window.openTransportModal()" class="bg-blue-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-md shrink-0 uppercase tracking-tighter">+ Bilhete</button>
                <button onclick="window.openDayExtraModal()" class="bg-amber-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-md shrink-0 uppercase tracking-tighter font-mono">+ Extra</button>
                <button onclick="window.generateDayPDF(event)" class="bg-white text-red-600 text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-sm border border-red-100 shrink-0 uppercase">📄 PDF</button>
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
                        <span class="bg-orange-100 px-2 rounded-full font-mono">${d.extraCosts.length}</span>
                    </summary>
                    <div class="mt-4 space-y-2">
                        ${d.extraCosts.map((ex, i) => `
                            <div class="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-orange-100 shadow-sm">
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

    new Sortable(document.getElementById('attractionsContainer'), {
        animation: 150,
        handle: '.attraction-item',
        delay: 300,
        delayOnTouchOnly: true,
        dataIdAttr: 'data-id',
        onEnd: () => updateAttractionOrder(document.querySelectorAll('#attractionsContainer .attraction-item')),
    });
}

function updateAttractionOrder(nodeList) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const ids = Array.from(nodeList).map(el => el.getAttribute('data-id'));
    
    const combined = [...d.transport, ...d.attractions];
    const newAtt = [], newTrans = [];
    
    ids.forEach(id => {
        const item = combined.find(i => String(i.id) === String(id));
        if (item) {
            // Se for transporte (tem steps ou está na lista original de transporte), vai pro array de transporte
            const isTransport = d.transport.some(tr => String(tr.id) === String(id));
            if (isTransport) newTrans.push(item);
            else newAtt.push(item);
        }
    });
    
    d.attractions = newAtt; 
    d.transport = newTrans;
    saveData();
}

// --- TODAS AS FUNÇÕES EXPORTADAS E ÚNICAS ---

export function renameDay() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const newTitle = prompt('Novo título do dia:', d.customTitle || ''); if (newTitle === null) return;
    const newSub = prompt('Subtítulo / Frase do dia:', d.subtitle || ''); if (newSub === null) return;
    d.customTitle = newTitle.trim(); d.subtitle = newSub.trim();
    saveData(); window.render();
}

export function toggleVisited(aid) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = d.attractions.find(x => String(x.id) === String(aid));
    if (!a) return;
    a.visited = !a.visited;
    saveData(); window.render();
}

export function deleteAttraction(id) {
    if (!confirm('Deseja realmente apagar esta atração?')) return;
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
        if (btn) {
            if (m === mode) btn.className = 'flex-1 border rounded-lg p-2 text-[10px] font-bold bg-blue-100 border-blue-500 shadow-sm transition-all';
            else btn.className = 'flex-1 border rounded-lg p-2 text-[10px] font-bold bg-white border-gray-200 shadow-sm transition-all hover:border-blue-300';
        }
    });
}

export function toggleRoutePanel(id) {
    if (!currentInlineModes[id]) setInlineMode(id, 'd');
}

export function toggleTicketContent(id) {
    const content = document.getElementById(`ticket-content-${id}`);
    const arrow = document.getElementById(`arrow-${id}`);
    if (!content || !arrow) return;
    const isHidden = content.classList.contains('hidden');
    content.classList.toggle('hidden');
    arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

export function toggleMarauderMap(dayId) {
    const container = document.getElementById(`map-container-${dayId}`);
    const arrow = document.getElementById(`arrow-map-${dayId}`);
    if (!container) return;
    const isHidden = container.classList.contains('hidden');
    container.classList.toggle('hidden', !isHidden);
    if (arrow) arrow.innerText = isHidden ? '▲' : '▼';
}

export function setMarauderMap(dayId) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === dayId); if (!d) return;
    const url = prompt('Cole o link do Google My Maps para este dia:', d.mapUrl || '');
    if (url !== null) { d.mapUrl = url; saveData(); window.render(); }
}

export function deleteDayExtra(index) {
    if (!confirm('Excluir este gasto?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.extraCosts.splice(index, 1); saveData(); window.render();
}

export function openBatchMoveCopy() {
    const checks = document.querySelectorAll('.route-selector:checked');
    if (checks.length === 0) return alert('Selecione os itens marcando as caixas ao lado deles.');
    import('../store.js').then(({ setCurrentBatchIds, setCurrentAttractionToMove }) => {
        setCurrentBatchIds(Array.from(checks).map(c => c.value));
        setCurrentAttractionToMove(null);
        window.prepareMoveModal(`Mover/Copiar ${checks.length} Itens`);
    });
}

export function toggleSelectAllAttractions() {
    const checkboxes = document.querySelectorAll('.route-selector');
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every(c => c.checked);
    checkboxes.forEach(c => c.checked = !allChecked);
}

export function sortAttractionsByPriority() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t?.days.find(x => x.id === currentState.dayId);
    if (!d || !d.attractions?.length) return alert('Nenhuma atração para ordenar.');
    
    const w = { must_see: 1, imperdivel: 1, photo: 2, foto: 2, maybe: 3, se_der: 3, standard: 4, padrao: 4 };
    d.attractions.sort((a, b) => {
        const pA = (a.priority || 'standard').toLowerCase().trim();
        const pB = (b.priority || 'standard').toLowerCase().trim();
        return (w[pA] || 4) - (w[pB] || 4);
    });
    
    saveData(); window.render();
}