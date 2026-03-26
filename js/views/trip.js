// --- VIEW: TRIP ---
import { appData, currentState, saveData } from '../store.js';
import { formatDateBr, getDayName, randomId } from '../utils.js';

export function renderTrip(container, tripId) {
    const t = appData.trips.find(x => x.id === tripId);
    if (!t) return window.goTo('home');

    const regularDays  = t.days.filter(d => !d.isBucket);
    const bucketLists  = t.days.filter(d => d.isBucket);

    let html = `
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 sticky top-0 bg-[#fffef0] z-10 py-2 border-b border-gray-300">
            <div class="flex items-center gap-4">
                <button onclick="window.goTo('home')" class="btn bg-white border shadow-sm shrink-0">⬅ Voltar</button>
                <div>
                    <h1 class="text-2xl font-magic uppercase font-bold text-[#0c4a6e]">${t.destination}</h1>
                    <p class="text-xs text-gray-500">${t.startDate} - ${t.endDate}</p>
                </div>
            </div>
            <div class="flex gap-2 flex-wrap trip-header-controls justify-center md:justify-end">
                <button onclick="window.openDocumentsModal()" class="btn bg-slate-800 text-white text-xs">🔐 Docs</button>
                <button onclick="window.openHotelManager()"   class="btn btn-primary text-white text-xs">🏨 Hotéis</button>
                <button onclick="window.openChecklist()"      class="btn bg-gray-100 border text-gray-700 text-xs">✅ Checklist</button>
                <button onclick="window.openRadarModal()"     class="btn bg-indigo-600 text-white text-xs shadow border border-indigo-800 animate-pulse">📡 Radar</button>
                <button onclick="window.generateVisitedKML()" class="btn btn-primary text-xs">🗺️ KML</button>
                <button onclick="window.generateICS()"        class="btn bg-gray-100 border text-blue-700 text-xs">📅 Agenda</button>
                <button onclick="window.generatePDF(event)"   class="btn bg-gray-100 border text-red-700 text-xs">📄 Roteiro</button>
                <button onclick="window.generateCalendarPDF(event)" class="btn bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold">📆 Calendário</button>
                <button onclick="window.openFinanceModal()"   class="btn btn-gold text-xs">💰 Finanças</button>
            </div>
        </div>

        <div id="daysGrid" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-6">`;

    regularDays.forEach((d, index) => {
        let hotelBadges = '';
        (t.hotels || []).forEach(h => {
            const base = 'text-xs px-1 rounded mt-1 border truncate';
            if      (h.checkIn  === d.date)                        hotelBadges += `<div class="${base} bg-green-100 text-green-800 border-green-200">🛎️ In: ${h.name}</div>`;
            else if (h.checkOut === d.date)                        hotelBadges += `<div class="${base} bg-orange-100 text-orange-800 border-orange-200">👋 Out: ${h.name}</div>`;
            else if (d.date > h.checkIn && d.date < h.checkOut)   hotelBadges += `<div class="${base} bg-blue-50 text-blue-800 border-blue-200">🛏️ Estadia: ${h.name}</div>`;
        });

        const subtitleHtml = d.subtitle ? `<p class="text-xs text-gray-500 italic text-center -mt-1 mb-2">"${d.subtitle}"</p>` : '';

        html += `
            <div onclick="window.openDay('${t.id}', '${d.id}')" data-id="${d.id}"
                 class="card p-5 cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1 relative group day-card-item">
                <div class="absolute top-0 left-1/2 transform -translate-x-1/2 p-2 px-6 text-lg font-bold text-white bg-[#0c4a6e] rounded-b-xl shadow-md whitespace-nowrap">
                    ${formatDateBr(d.date)} <span class="text-xs font-normal opacity-80 ml-1">(${getDayName(d.date)})</span>
                </div>
                <h3 class="text-xl font-bold mb-1 mt-6 text-[#0c4a6e] text-center">${d.customTitle || 'Dia ' + (index + 1)}</h3>
                ${subtitleHtml}
                <p class="text-sm text-gray-600 mb-3 text-center">${d.locations.map(l => l.name.split(',')[0]).join(' & ') || 'Sem localidades'}</p>
                <div class="text-xs text-gray-500 mb-3 flex flex-col">${hotelBadges}</div>
                <div class="text-xs text-gray-500 text-center">
                    <span>${d.attractions.length} Atrações</span> | <span>${d.transport.length} Bilhetes</span>
                </div>
            </div>`;
    });

    html += `</div>`;

    // Bucket lists (cidades extras / ideias)
    html += `
        <div class="border-t-2 border-dashed border-gray-300 pt-6 mt-2">
            <h2 class="text-xl font-magic uppercase text-gray-500 mb-4 text-center">🌍 Cidades Extras & Ideias</h2>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-10">
                ${bucketLists.map(d => `
                    <div onclick="window.openDay('${t.id}', '${d.id}')"
                         class="card p-5 cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1 bg-white border-2 border-dashed border-gray-300 relative group">
                        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 p-1 px-4 text-xs font-bold text-white bg-gray-400 rounded-b-lg shadow-sm">SEM DATA</div>
                        <h3 class="text-xl font-bold mb-1 mt-4 text-gray-600 text-center">${d.customTitle}</h3>
                        <p class="text-xs text-gray-400 italic mb-3 text-center">Banco de ideias / Plano B</p>
                        <div class="text-xs text-gray-500 text-center"><span>${d.attractions.length} Atrações salvas</span></div>
                        <button onclick="event.stopPropagation(); window.deleteDay('${d.id}')" class="absolute top-2 right-2 text-red-300 hover:text-red-500 p-1">🗑</button>
                    </div>`).join('')}
                <div onclick="window.addBucketList()"
                     class="card p-5 cursor-pointer hover:bg-gray-50 border-2 border-dashed border-[#0c4a6e] flex flex-col items-center justify-center text-[#0c4a6e] opacity-70 hover:opacity-100 transition">
                    <span class="text-4xl mb-2">🏙️</span><span class="font-bold uppercase text-sm">+ Nova Cidade</span>
                </div>
            </div>
        </div>
        <div class="fixed bottom-6 right-6 z-30">
            <button onclick="window.addDay()" class="btn btn-primary py-3 px-6 text-sm font-bold shadow-2xl rounded-full h-14 w-14 flex items-center justify-center text-2xl" title="Adicionar Dia">+</button>
        </div>`;

    container.innerHTML = html;

    // Drag-and-drop dos dias
    new Sortable(document.getElementById('daysGrid'), {
        animation: 150,
        handle: '.day-card-item',
        delay: 300,
        delayOnTouchOnly: true,
        touchStartThreshold: 5,
        dataIdAttr: 'data-id',
        onEnd: () => updateDayOrder(document.querySelectorAll('#daysGrid [data-id]'), t.id),
    });
}

// --- AÇÕES DO TRIP ---
export function addDay() {
    const t = appData.trips.find(x => x.id === currentState.tripId); if (!t) return;
    const regularDays = t.days.filter(d => !d.isBucket);
    const lastDate    = regularDays.length > 0 ? regularDays.at(-1).date : t.startDate;
    const newDate     = new Date(lastDate + 'T00:00:00');
    newDate.setDate(newDate.getDate() + 1);
    const newDateStr  = newDate.toISOString().split('T')[0];
    if (newDateStr > t.endDate) t.endDate = newDateStr;
    t.days.push({ id: randomId(), date: newDateStr, locations: [], attractions: [], transport: [], extraCosts: [], journal: '', subtitle: '' });
    saveData(); window.render();
}

export function addBucketList() {
    const t    = appData.trips.find(x => x.id === currentState.tripId); if (!t) return;
    const name = prompt("Nome da Cidade ou Lista (Ex: 'Ideias Veneza'):"); if (!name) return;
    t.days.push({ id: randomId(), date: '', isBucket: true, customTitle: name, locations: [], attractions: [], transport: [], extraCosts: [], journal: '', subtitle: '' });
    saveData(); window.render();
}

export function deleteDay(dayId) {
    if (!confirm('Tem certeza que deseja apagar este dia/cidade?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.days  = t.days.filter(d => d.id !== dayId);
    saveData(); window.render();
}

function updateDayOrder(nodeList, tripId) {
    const t       = appData.trips.find(x => x.id === tripId); if (!t) return;
    const ids     = Array.from(nodeList).map(el => el.dataset.id);
    const oldDays = t.days;
    const newDays = [];
    ids.forEach(id => { const day = oldDays.find(d => d.id === id); if (day) newDays.push(day); });

    let curr = new Date(t.startDate + 'T00:00:00');
    newDays.forEach(d => { if (!d.isBucket) { d.date = curr.toISOString().split('T')[0]; curr.setDate(curr.getDate() + 1); } });

    t.days    = newDays;
    t.endDate = newDays.at(-1)?.date || t.endDate;
    saveData(); window.render();
}