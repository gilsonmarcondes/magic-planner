// --- VIEW: DAY ---
import { appData, currentState, currentInlineModes, saveData, setCurrentInlineModes, setCurrentState } from '../store.js';
import { formatDateBr, getDayName, closeModals } from '../utils.js';
import { CATEGORIES } from '../config.js';

export function renderDay(container, tripId, dayId) {
    if (tripId) setCurrentState({ tripId, dayId });
    const t = appData.trips.find(x => x.id === (tripId || currentState.tripId));
    const d = t?.days.find(x => x.id === (dayId || currentState.dayId));
    if (!d) return window.goTo('trip', t?.id);

    // --- Totais do dia ---
    let totalDia = 0;
    d.attractions.forEach(a => a.costs.forEach(c => totalDia += Number(c.value || 0)));
    d.transport.forEach(tr => totalDia += Number(tr.cost || 0));
    d.extraCosts.forEach(ex => totalDia += Number(ex.value || 0));

    // --- Mapa do Maroto ---
    let marauderMapHtml = '';
    if (d.mapUrl) {
        const embedUrl = d.mapUrl.includes('google.com/maps/d/')
            ? d.mapUrl.replace(/\/viewer\?/, '/embed?').replace(/\/edit\?/, '/embed?')
            : d.mapUrl;
        marauderMapHtml = `
            <div class="card mb-4 border-2 border-[#d4af37] overflow-hidden shadow-lg rounded-lg">
                <div onclick="window.toggleMarauderMap('${d.id}')" class="cursor-pointer bg-[#d4af37] text-white p-3 flex justify-between items-center hover:bg-[#b49020] transition select-none">
                    <span class="font-bold text-sm uppercase flex items-center gap-2">📜 Mapa do Maroto</span>
                    <span id="arrow-map-${d.id}" class="text-xl font-bold">▼</span>
                </div>
                <div id="map-container-${d.id}" class="hidden">
                    <iframe src="${embedUrl}" width="100%" height="550" frameborder="0" allowfullscreen></iframe>
                    <div class="bg-gray-50 p-2 text-right border-t">
                        <button onclick="window.setMarauderMap('${d.id}')" class="text-xs text-blue-600 underline">✏️ Editar Link</button>
                    </div>
                </div>
            </div>`;
    } else {
        marauderMapHtml = `
            <div onclick="window.setMarauderMap('${d.id}')" class="card p-4 mb-4 border-2 border-dashed border-[#d4af37] bg-yellow-50 cursor-pointer hover:bg-yellow-100 flex items-center justify-center text-[#b45309] shadow-sm transition">
                <span class="text-xl mr-2">📜</span> <span class="font-bold text-sm uppercase">Adicionar Mapa do Dia</span>
            </div>`;
    }

    // --- Badges de hotel ---
    let hotelsHtml = '';
    if (d.date) {
        t.hotels.forEach(h => {
            if      (h.checkIn  === d.date)                     hotelsHtml += `<div class="bg-green-100 border-l-4 border-green-500 text-green-800 p-2 mb-2 rounded flex justify-between items-center"><span><b>🛎️ Check-in:</b> ${h.name}</span></div>`;
            else if (h.checkOut === d.date)                     hotelsHtml += `<div class="bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-2 mb-2 rounded flex justify-between items-center"><span><b>👋 Check-out:</b> ${h.name}</span></div>`;
            else if (d.date > h.checkIn && d.date < h.checkOut) hotelsHtml += `<div class="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-2 mb-2 rounded flex justify-between items-center"><span><b>🛏️ Estadia:</b> ${h.name}</span></div>`;
        });
    }

    // --- Localidades ---
    const locationsHtml = `
        <div class="card p-4 mb-4 border-l-4 border-l-green-400">
            <details>
                <summary class="font-bold cursor-pointer text-green-700 flex items-center gap-2">📍 Destinos / Clima</summary>
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-bold text-gray-500 uppercase">Localidades:</span>
                        <button onclick="window.openCitySearch()" class="btn btn-xs bg-green-100 text-green-800 border">Adicionar</button>
                    </div>
                    <ul class="space-y-2">
                        ${d.locations.map(l => `
                            <li class="flex justify-between items-center text-sm p-2 bg-gray-50 rounded border">
                                <span>${l.name}</span>
                                <button onclick="window.removeLocation('${l.name}')" class="text-red-400">×</button>
                            </li>`).join('')}
                    </ul>
                    <div class="mt-4">
                        <button onclick="window.fetchWeather()" class="btn btn-xs bg-blue-100 text-blue-800 border">Atualizar Clima</button>
                        <div id="weatherDisplay" class="text-sm text-gray-600 mt-2">${d.weather || ''}</div>
                    </div>
                </div>
            </details>
        </div>`;

    // --- Transportes ---
    const transportHtml = d.transport.map(tr => {
        let iframeHtml = '';
        if (tr.mapUrl) {
            let src = tr.mapUrl;
            if (src.includes('<iframe')) {
                const match = src.match(/src="([^"]+)"/);
                if (match) src = match[1];
            }
            if (src) {
                iframeHtml = `<div class="mt-3 rounded-lg overflow-hidden border-2 border-blue-200 shadow-inner"><iframe src="${src}" width="100%" height="250" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
            }
        }

        return `
        <div id="attraction-${tr.id}" class="card p-4 border-l-8 border-l-blue-500 relative mb-4 attraction-item shadow-md" style="background-color:#e0f2fe" data-id="${tr.id}">
            <div class="flex justify-between items-start">
                <div class="flex gap-2 items-start w-full">
                    <div class="pt-1 shrink-0">
                        <input type="checkbox" onclick="event.stopPropagation()" class="route-selector w-5 h-5 accent-emerald-600 cursor-pointer" value="${tr.id}">
                    </div>
                    <div onclick="window.toggleTicketContent('${tr.id}')" class="cursor-pointer flex items-center justify-between w-full">
                        <div>
                            <h4 class="font-bold text-blue-900 uppercase text-xs">🎫 ${tr.title}</h4>
                            <p class="text-xs font-bold text-blue-700">${tr.currency} ${parseFloat(tr.cost).toFixed(2)}</p>
                        </div>
                        <span id="arrow-${tr.id}">▼</span>
                    </div>
                </div>
                <div class="flex gap-1 shrink-0 ml-2">
                    <button onclick="window.openMoveCopyModal('${tr.id}')">🔄</button>
                    <button onclick="window.openTransportModal('${tr.id}')">✏️</button>
                    <button onclick="window.deleteTransport('${tr.id}')" class="text-red-400">×</button>
                </div>
            </div>
            <div id="ticket-content-${tr.id}" class="mt-4 hidden">
                ${tr.steps.map(s => `<div class="text-[10px] mb-1"><b>${s.icon} ${s.time}</b>: ${s.location}➔${s.arrivalLoc}</div>`).join('')}
                ${iframeHtml}
            </div>
        </div>`;
    }).join('');

    // --- Atrações ---
    const attractionsHtml = d.attractions.map(a => {
        const category = CATEGORIES[a.type] || CATEGORIES.other;
        let cardStyle = 'background-color:#ffffff; border:1px solid #e2e8f0;';
        let priorityBadge = '';
        const prio = (a.priority || 'standard').toLowerCase().trim();
        if      (prio === 'must_see' || prio === 'imperdivel') { cardStyle = 'background-color:#fef3c7; border:1px solid #fcd34d;'; priorityBadge = '<span class="bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded ml-2">🌟 IMPERDÍVEL</span>'; }
        else if (prio === 'photo')                             { cardStyle = 'background-color:#fdf4ff; border:1px solid #f5d0fe;'; priorityBadge = '<span class="bg-fuchsia-500 text-white text-[8px] font-bold px-2 py-0.5 rounded ml-2">📸 SÓ FOTO</span>'; }
        else if (prio === 'maybe')                             { cardStyle = 'background-color:#f1f5f9; border:1px solid #e2e8f0; opacity:0.9;'; priorityBadge = '<span class="bg-slate-500 text-white text-[8px] font-bold px-2 py-0.5 rounded ml-2">⏳ SE DER</span>'; }

        const numBadge = a.mapNumber ? `<span class="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm shrink-0 border border-red-700 mt-1">${a.mapNumber}</span>` : '';
        const subHtml  = a.subtitle  ? `<p class="text-xs text-gray-500 italic font-serif -mt-0.5 mb-1">"${a.subtitle}"</p>` : '';

        const images = (a.photos?.length > 0) ? a.photos : (a.photo ? [a.photo] : []);
        const galleryHtml = images.length > 0
            ? `<div class="flex gap-3 overflow-x-auto pb-3 mb-3">${images.map(src => `<img src="${src}" onclick="window.open('${src}','_blank')" class="h-48 min-w-[200px] object-cover rounded-lg shadow-md border shrink-0 cursor-zoom-in" onerror="this.style.display='none'">`).join('')}</div>`
            : '';

        return `
        <div id="attraction-${a.id}" class="attraction-item card p-4 border-l-8 relative mb-4 shadow-md" style="${cardStyle}" data-id="${a.id}">
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
                                    <button onclick="window.quickShowHistory('${a.id}')" class="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full shadow-sm hover:bg-blue-50">📖 Ler</button>
                                </div>
                                ${subHtml}
                                <p class="text-xs text-gray-500 mt-1">${a.hours || ''} | ${a.address || ''}</p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1 shrink-0 ml-1">
                            <div class="flex gap-2">
                                <button onclick="window.openMoveCopyModal('${a.id}')">🔄</button>
                                <button onclick="window.openAttractionModal('${a.id}')">✏️</button>
                                <button onclick="window.deleteAttraction('${a.id}')">×</button>
                            </div>
                            <button onclick="window.toggleVisited('${a.id}')" class="text-[10px] font-bold mt-1 ${a.visited ? 'text-green-700 bg-green-200' : 'text-gray-500 bg-white/50'} px-2 py-1 rounded-full border">
                                ${a.visited ? '✅ Feito' : '◻ A Fazer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <details class="text-sm mt-2 ml-8">
                <summary class="font-bold text-gray-600 cursor-pointer text-xs">Detalhes</summary>
                <div class="mt-2 p-2 bg-white/80 rounded border prose prose-sm max-w-none">${a.description || '...'}</div>
            </details>
            <div class="mt-3 pt-3 border-t border-dashed border-gray-300 ml-8">
                <details class="bg-white/40 p-2 rounded border border-gray-200">
                    <summary onclick="window.toggleRoutePanel('${a.id}')" class="font-bold text-blue-800 cursor-pointer text-xs">🧭 Como Chegar</summary>
                    <div id="route-panel-${a.id}" class="route-panel p-2 mt-2">
                        <div class="mb-2">
                            <button id="gps-btn-${a.id}" onclick="window.useMyLocation('${a.id}')" class="w-full btn bg-blue-50 text-blue-700 border border-blue-200 text-xs mb-2 hover:bg-blue-100">📍 Usar minha localização</button>
                            <div class="flex items-center gap-2 mb-2">
                                <div class="flex-1 h-px bg-gray-200"></div>
                                <span class="text-[10px] text-gray-400">ou digite o endereço</span>
                                <div class="flex-1 h-px bg-gray-200"></div>
                            </div>
                            <input id="origin-${a.id}" placeholder="Ex: Tower Bridge, Londres..." class="w-full p-2 border rounded text-xs" onfocus="window.initOriginAutocomplete('${a.id}')">
                        </div>
                        <div class="flex justify-between gap-1 mb-2">
                            <button id="mode-d-${a.id}" onclick="window.setInlineMode('${a.id}','d')" class="flex-1 border rounded p-1 text-xs bg-blue-100">🚗 Carro</button>
                            <button id="mode-t-${a.id}" onclick="window.setInlineMode('${a.id}','t')" class="flex-1 border rounded p-1 text-xs">🚌 Transp.</button>
                            <button id="mode-w-${a.id}" onclick="window.setInlineMode('${a.id}','w')" class="flex-1 border rounded p-1 text-xs">🚶 A pé</button>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.calcInlineRoute('${a.id}')" class="btn btn-primary text-[10px] flex-1">Ver Mapa Interno</button>
                            <button onclick="window.openGPSRoute('${a.id}')"    class="btn bg-green-600 text-white text-[10px] flex-1">Abrir GPS</button>
                        </div>
                    </div>
                    <div id="map-container-${a.id}" class="hidden mt-3 border rounded h-[400px] relative">
                        <iframe id="map-frame-${a.id}" width="100%" height="100%" frameborder="0"></iframe>
                    </div>
                </details>
            </div>
        </div>`;
    }).join('');

    const subtitleHtml = d.subtitle ? `<p class="text-xs text-gray-500 italic text-center -mt-1 mb-2">"${d.subtitle}"</p>` : '';
    const dayIndex     = t.days.findIndex(x => x.id === d.id);

    container.innerHTML = `
        <div class="sticky top-0 bg-[#fffef0] z-20 py-2 border-b border-gray-300">
            <div class="flex items-center justify-between mb-2">
                <button onclick="window.goTo('trip','${t.id}')" class="btn bg-white border shadow-sm">⬅ Roteiro</button>
                <div class="text-center">
                    <h2 class="text-2xl font-bold text-[#0c4a6e]">${d.customTitle || 'Dia ' + (dayIndex + 1)} ${d.date ? '(' + formatDateBr(d.date) + ' - ' + getDayName(d.date) + ')' : ''}</h2>
                    ${subtitleHtml}
                </div>
                <button onclick="window.renameDay()" class="text-gray-500">✏️</button>
            </div>
            <div class="bg-emerald-600 text-white p-2 rounded shadow-md text-center mb-2 flex justify-between items-center px-4">
                <span class="text-xs uppercase font-bold">Total do Dia:</span>
                <span class="text-xl font-bold font-mono">R$ ${totalDia.toFixed(2)}</span>
            </div>
            <div class="flex gap-2 justify-center pb-2 flex-wrap">
                <button onclick="window.openFullDayRoute()"        class="btn bg-emerald-600 text-white text-sm shadow border border-emerald-700">🗺️ Traçar Rota</button>
                <button onclick="window.openAttractionModal()"     class="btn btn-primary text-sm shadow">+ Atração</button>
                <button onclick="window.openTransportModal()"      class="btn btn-primary text-sm shadow">+ Bilhete</button>
                <button onclick="window.openDayExtraModal()"       class="btn btn-success text-sm shadow">+ Extra</button>
                <button onclick="window.generateDayPDF(event)"     class="btn bg-gray-100 border shadow text-red-700 text-sm">📄 PDF do Dia</button>
                <button onclick="window.toggleSelectAllAttractions()" class="btn bg-indigo-100 text-indigo-800 text-sm shadow border border-indigo-300">☑️ Selecionar Tudo</button>
                <button onclick="window.openBatchMoveCopy()"       class="btn bg-purple-600 text-white text-sm shadow border border-purple-800">🔄 Mover</button>
                <button id="btnSortPrio" onclick="window.sortAttractionsByPriority()" class="btn btn-gold text-sm shadow">🌪️ Ordenar</button>
            </div>
        </div>
        <div class="max-w-4xl mx-auto py-4 pl-4">
            ${marauderMapHtml}
            ${hotelsHtml}
            ${locationsHtml}
            <div id="embeddedRouteDisplay" class="hidden mb-6 bg-white p-2 rounded border border-emerald-200 shadow-lg relative">
                <div class="flex justify-between items-center mb-2 px-1">
                    <h4 class="font-bold text-emerald-800 text-sm">🗺️ Rota a Pé Gerada</h4>
                    <button onclick="document.getElementById('embeddedRouteDisplay').classList.add('hidden')" class="text-gray-400 hover:text-red-500 font-bold px-2">✕</button>
                </div>
                <div id="embeddedRouteFrameContainer" class="w-full h-[400px] bg-gray-100 rounded"></div>
            </div>
            <div id="attractionsContainer">${transportHtml}${attractionsHtml}</div>
            <div class="card p-4 mb-4 border-l-4 border-l-orange-400">
                <details>
                    <summary class="font-bold cursor-pointer text-orange-700">💸 Gastos Extras</summary>
                    <div class="mt-2 space-y-1">
                        ${d.extraCosts.map((ex, i) => `
                            <div class="flex justify-between items-center text-sm p-2 border-b border-dashed">
                                <span class="font-bold">${ex.desc}</span>
                                <span>${ex.currency} ${parseFloat(ex.value).toFixed(2)}</span>
                                <button onclick="window.deleteDayExtra(${i})" class="text-red-400">×</button>
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
        touchStartThreshold: 5,
        dataIdAttr: 'id',
        onEnd: () => updateAttractionOrder(document.querySelectorAll('#attractionsContainer .attraction-item')),
    });
}

function updateAttractionOrder(nodeList) {
    const t   = appData.trips.find(x => x.id === currentState.tripId);
    const d   = t.days.find(x => x.id === currentState.dayId);
    const ids = Array.from(nodeList).map(el => el.id.replace('attraction-', ''));
    const combined  = [...d.transport, ...d.attractions];
    const newAtt    = [], newTrans = [];
    ids.forEach(id => {
        const item = combined.find(i => String(i.id) === String(id));
        if (item) (item.steps ? newTrans : newAtt).push(item);
    });
    d.attractions = newAtt; d.transport = newTrans;
    saveData();
}

export function renameDay() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const newTitle = prompt('Novo título:', d.customTitle || ''); if (newTitle === null) return;
    const newSub   = prompt('Novo Subtítulo (opcional):', d.subtitle || ''); if (newSub === null) return;
    d.customTitle = newTitle.trim(); d.subtitle = newSub.trim();
    saveData(); window.render();
}

export function toggleVisited(aid) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = d.attractions.find(x => String(x.id) === String(aid));
    a.visited = !a.visited;
    saveData();

    const card = document.getElementById(`attraction-${aid}`);
    if (card) {
        const nameEl = card.querySelector('h4');
        const btn    = card.querySelector(`button[onclick*="toggleVisited"]`);
        if (nameEl) nameEl.className = nameEl.className.replace(
            a.visited ? 'text-\\[#0c4a6e\\]' : 'line-through text-gray-400',
            a.visited ? 'line-through text-gray-400' : 'text-[#0c4a6e]'
        );
        if (btn) btn.innerHTML = a.visited ? '✅ Feito' : '◻ A Fazer';
        if (btn) btn.className = btn.className.replace(
            a.visited ? 'text-gray-500 bg-white/50' : 'text-green-700 bg-green-200',
            a.visited ? 'text-green-700 bg-green-200' : 'text-gray-500 bg-white/50'
        );
    }
}

export function deleteAttraction(id) {
    if (!confirm('Deletar?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.attractions = d.attractions.filter(a => String(a.id) !== String(id));
    saveData(); window.render();
}

export function sortAttractionsByPriority() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    if (!d.attractions?.length) return alert('Nenhuma atração para ordenar.');
    const w = { must_see: 1, imperdivel: 1, photo: 2, foto: 2, maybe: 3, se_der: 3, standard: 4, padrao: 4 };
    d.attractions.sort((a, b) => (w[(a.priority || 'standard').toLowerCase()] || 4) - (w[(b.priority || 'standard').toLowerCase()] || 4));
    saveData(); window.render();
    const btn = document.getElementById('btnSortPrio');
    if (btn) { const orig = btn.innerHTML; btn.innerHTML = '✅ Ordenado!'; setTimeout(() => btn.innerHTML = orig, 1500); }
}

export function setInlineMode(id, mode) {
    currentInlineModes[id] = mode;
    setCurrentInlineModes(currentInlineModes);
    ['d', 't', 'w'].forEach(m => document.getElementById(`mode-${m}-${id}`)?.classList.remove('bg-blue-100', 'border-blue-500'));
    document.getElementById(`mode-${mode}-${id}`)?.classList.add('bg-blue-100', 'border-blue-500');
}

export function toggleRoutePanel(id) {
    document.getElementById(`route-panel-${id}`)?.classList.toggle('open');
    if (!currentInlineModes[id]) setInlineMode(id, 'd');
}

export function toggleTicketContent(id) {
    const content = document.getElementById(`ticket-content-${id}`);
    const arrow   = document.getElementById(`arrow-${id}`);
    if (!content || !arrow) return;
    const isHidden = content.style.display === 'none' || content.style.display === '';
    content.style.display = isHidden ? 'block' : 'none';
    arrow.style.transform  = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

export function toggleMarauderMap(dayId) {
    const container = document.getElementById(`map-container-${dayId}`);
    const arrow     = document.getElementById(`arrow-map-${dayId}`);
    const isHidden  = container.classList.contains('hidden');
    container.classList.toggle('hidden', !isHidden);
    arrow.innerText = isHidden ? '▲' : '▼';
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
    if (checks.length === 0) return alert('Por favor, marque as caixinhas ao lado das atrações que deseja mover.');
    import('../store.js').then(({ setCurrentBatchIds, setCurrentAttractionToMove }) => {
        setCurrentBatchIds(Array.from(checks).map(c => c.value));
        setCurrentAttractionToMove(null);
        window.prepareMoveModal(`Mover/Copiar ${checks.length} Itens`);
    });
}

// RESTAURADO: Função para selecionar todas as atrações
export function toggleSelectAllAttractions() {
    const checkboxes = document.querySelectorAll('.route-selector');
    if (checkboxes.length === 0) return;
    
    // Verifica se todos já estão marcados
    const allChecked = Array.from(checkboxes).every(c => c.checked);
    
    // Inverte o estado de todos (se todos marcados, desmarca. Se não, marca todos)
    checkboxes.forEach(c => c.checked = !allChecked);
}