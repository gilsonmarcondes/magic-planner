import { appData, saveData } from '../store.js';
import { render, goTo } from '../router.js';
import { closeModals } from '../utils.js';

export function renderHome() {
    if (!appData.trips) appData.trips = [];
    let html = `
        <div class="p-4 max-w-5xl mx-auto animate-fade-in">
            <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 class="text-2xl font-bold text-[#0c4a6e] uppercase">Minhas Viagens</h2>
                <div class="flex gap-2">
                    <button onclick="window.openTripModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow font-bold flex items-center">
                        <span class="mr-2 text-xl">+</span> Nova Viagem
                    </button>
                    <label class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition shadow cursor-pointer font-bold text-[10px] uppercase flex items-center">
                        📂 Importar Backup
                        <input type="file" accept=".json" class="hidden" onchange="window.importData(event)">
                    </label>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;

    if (appData.trips.length === 0) {
        html += `<div class="col-span-full text-center text-gray-400 py-10 bg-white border border-dashed rounded-xl">Nenhuma viagem encontrada.</div>`;
    } else {
        appData.trips.forEach(t => {
            html += `
                <div class="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-5 relative group cursor-pointer" onclick="window.goTo('trip', '${t.id}')">
                    <div class="flex justify-between items-start">
                        <h3 class="text-lg font-bold text-[#0c4a6e] pr-8">${t.name}</h3>
                        <button onclick="event.stopPropagation(); window.editTripMetadata('${t.id}')" class="text-gray-300 hover:text-blue-500 transition">✏️</button>
                    </div>
                    <p class="text-sm text-gray-500 mt-2 font-medium">📅 ${t.days ? t.days.length : 0} dias planeados</p>
                    <div class="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition">
                         <button onclick="event.stopPropagation(); window.deleteTrip('${t.id}')" class="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-widest">Apagar</button>
                    </div>
                </div>`;
        });
    }
    html += `</div></div>`;
    const appEl = document.getElementById('app');
    if (appEl) appEl.innerHTML = html;
}

// --- GESTÃO DO MODAL DE VIAGEM ---
let editingTripId = null;

export function openTripModal(id = null) {
    editingTripId = id;
    const modal = document.getElementById('tripModal');
    if (!modal) return;
    const t = id ? appData.trips.find(x => x.id === id) : null;

    document.getElementById('tripModalTitle').innerText = t ? 'Editar Viagem' : 'Nova Viagem';
    document.getElementById('tripName').value = t ? t.name : '';
    document.getElementById('tripStart').value = t ? t.startDate : '';
    document.getElementById('tripEnd').value = t ? t.endDate : '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export function editTripMetadata(id) { openTripModal(id); }

export async function saveTrip() {
    const name = document.getElementById('tripName').value.trim();
    const start = document.getElementById('tripStart').value;
    const end = document.getElementById('tripEnd').value;

    if (!name || !start || !end) return alert('Preencha todos os campos!');

    if (editingTripId) {
        const trip = appData.trips.find(x => x.id === editingTripId);
        trip.name = name; trip.startDate = start; trip.endDate = end;
    } else {
        const trip = {
            id: Math.random().toString(36).substr(2, 9),
            name, startDate: start, endDate: end, days: [], hotels: [], extraCosts: [], rates: { USD: 0, EUR: 0, GBP: 0 }
        };
        let curr = new Date(start + 'T00:00:00');
        const last = new Date(end + 'T00:00:00');
        while (curr <= last) {
            trip.days.push({
                id: Math.random().toString(36).substr(2, 9),
                date: curr.toISOString().split('T')[0], attractions: [], transport: [], extraCosts: [], locations: []
            });
            curr.setDate(curr.getDate() + 1);
        }
        appData.trips.push(trip);
    }
    await saveData();
    closeModals();
    render();
}

export async function deleteTrip(id) {
    if (!confirm('Apagar esta viagem para sempre?')) return;
    appData.trips = appData.trips.filter(t => t.id !== id);
    await saveData();
    render();
}

export async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed.trips) return alert('Backup inválido.');
            appData.trips = [...appData.trips, ...parsed.trips];
            await saveData();
            render();
        } catch (err) { alert('Erro ao importar.'); }
    };
    reader.readAsText(file);
}