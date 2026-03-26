// --- VIEW: HOME ---
import { appData, saveData, setAppData } from '../store.js';
import { formatDateBr, randomId } from '../utils.js';


export function renderHome(container) {
    let html = `
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-300 pb-4">
            <h1 class="text-3xl font-magic uppercase text-[#0c4a6e]">Meus Roteiros 📜</h1>
            <div class="flex gap-2 flex-wrap justify-center">
                <button onclick="window.openSearchModal()"     class="btn btn-ghost border-[#0c4a6e] text-[#0c4a6e] shadow text-sm">🔍 Buscar</button>
                <label  class="btn btn-success shadow text-sm">📂 Importar
                    <input type="file" onchange="window.importData(event)" class="hidden" accept=".json">
                </label>
                <button onclick="window.exportData()"         class="btn btn-warning shadow text-sm">💾 Backup</button>
                <button onclick="window.goTo('new')"           class="btn btn-primary shadow text-sm">+ Novo</button>
            </div>
        </div>
        <div id="daysGrid" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">`;

    if (appData.trips.length === 0) {
        html += `<div class="col-span-3 text-center text-gray-400 p-10 border-2 dashed rounded-lg">Nenhum roteiro encontrado.</div>`;
    }

    appData.trips.forEach(t => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const start = new Date(t.startDate + 'T00:00:00');
        const end   = new Date(t.endDate   + 'T00:00:00');

        let statusBadge;
        if (today > end) {
            statusBadge = '<span class="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded">🏁 Concluída</span>';
        } else if (today >= start && today <= end) {
            statusBadge = '<span class="bg-green-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-pulse">✈️ Em andamento</span>';
        } else {
            const diffDays = Math.ceil(Math.abs(start - today) / 86400000);
            statusBadge = `<span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded shadow-lg">⏳ Faltam ${diffDays} dias</span>`;
        }

        let cardStyle, titleColor, subTextColor, overlayGradient = '';
        if (t.coverPhoto) {
            cardStyle    = `style="background-image: url('${t.coverPhoto}'); background-size: cover; background-position: center;"`;
            titleColor   = 'text-white drop-shadow-md';
            subTextColor = 'text-gray-200 drop-shadow-sm';
            overlayGradient = `<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent rounded-lg z-0"></div>`;
        } else {
            cardStyle    = 'style="background-color: #fffbeb;"';
            titleColor   = 'text-[#0c4a6e]';
            subTextColor = 'text-gray-600';
        }

        html += `
            <div onclick="window.openTrip('${t.id}')" data-id="${t.id}"
                 class="card cursor-pointer hover:shadow-2xl transition transform hover:-translate-y-1 relative group h-60 rounded-lg overflow-hidden border border-gray-200" ${cardStyle}>
                ${overlayGradient}
                <div class="absolute inset-0 p-5 flex flex-col justify-between z-10">
                    <div class="flex justify-between items-start">
                        <div>${statusBadge}</div>
                        <div class="flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
                            <button onclick="event.stopPropagation(); window.editTripMetadata('${t.id}')"
                                class="bg-white/90 text-blue-600 hover:text-blue-800 p-1.5 rounded-full shadow-md text-xs w-8 h-8 flex items-center justify-center" title="Editar">✏️</button>
                            <button onclick="event.stopPropagation(); window.deleteTrip('${t.id}')"
                                class="bg-white/90 text-red-400 hover:text-red-600 p-1.5 rounded-full shadow-md text-xs w-8 h-8 flex items-center justify-center">🗑</button>
                        </div>
                    </div>
                    <div>
                        <h2 class="text-2xl font-magic uppercase font-bold mb-0 leading-tight ${titleColor}">${t.destination}</h2>
                        <p class="text-sm font-bold mb-1 truncate ${subTextColor}">${t.name || ''}</p>
                        <div class="flex items-center gap-1 text-xs ${subTextColor} opacity-90">
                            <span>📅 ${formatDateBr(t.startDate)} ➝ ${formatDateBr(t.endDate)}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML = html + `</div>`;
}

// --- AÇÕES DE VIAGEM (expostas globalmente via main.js) ---
export function createTrip() {
    const name  = document.getElementById('newName').value;
    const dest  = document.getElementById('newDest').value;
    const start = document.getElementById('newStart').value;
    const end   = document.getElementById('newEnd').value;

    if (!name || !dest || !start || !end) return alert('Preencha todos os campos obrigatórios!');

    const days = [];
    const curr = new Date(start + 'T00:00:00');
    const endD  = new Date(end   + 'T00:00:00');
    while (curr <= endD) {
        days.push({ id: randomId(), date: curr.toISOString().split('T')[0], locations: [], attractions: [], transport: [], extraCosts: [], journal: '', subtitle: '' });
        curr.setDate(curr.getDate() + 1);
    }

    const trip = { id: randomId(), name, destination: dest, coverPhoto: '', startDate: start, endDate: end, days, initialCosts: [], checklist: [], documents: [], hotels: [], rates: { USD: 0, EUR: 0, GBP: 0 } };
    appData.trips.push(trip);
    saveData();
    window.goTo('trip', trip.id);
}

export function editTripMetadata(id) {
    const t = appData.trips.find(x => x.id === id); if (!t) return;
    const newDest  = prompt('Editar Destino:',                           t.destination);    if (newDest  === null) return;
    const newName  = prompt('Editar Nome da Viagem:',                    t.name);           if (newName  === null) return;
    const newPhoto = prompt('Link da Foto de Capa (vazio para remover):', t.coverPhoto || ''); if (newPhoto === null) return;
    t.destination = newDest; t.name = newName; t.coverPhoto = newPhoto;
    saveData(); window.render();
}

export function deleteTrip(id) {
    if (!confirm('Tem certeza que deseja deletar este roteiro?')) return;
    appData.trips = appData.trips.filter(t => t.id !== id);
    saveData(); window.goTo('home');
}

export function importData(e) {
    const reader = new FileReader();
    reader.onload = evt => {
        try {
            setAppData(JSON.parse(evt.target.result));
            saveData(); window.render();
            alert('Backup importado com sucesso! 🎉');
        } catch { alert('Erro ao ler arquivo.'); }
    };
    reader.readAsText(e.target.files[0]);
}
