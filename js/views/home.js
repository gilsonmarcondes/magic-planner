import { appData, saveData } from '../store.js';
import { render, goTo } from '../router.js';
import { closeModals } from '../utils.js';

export function renderHome() {
    if (!appData.trips) appData.trips = [];
    let html = `
        <div class="p-4 max-w-5xl mx-auto">
            <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 class="text-2xl font-bold text-[#0c4a6e]">Minhas Viagens</h2>
                <div class="flex gap-2">
                    <button onclick="window.openTripModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition shadow text-sm md:text-base flex items-center">
                        <span class="text-white font-bold mr-2 text-xl">+</span> Nova Viagem
                    </button>
                    <label class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition shadow cursor-pointer text-sm md:text-base">
                        📂 Importar Backup
                        <input type="file" accept=".json" class="hidden" onchange="window.importData(event)">
                    </label>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;

    if (appData.trips.length === 0) {
        html += `<div class="col-span-full text-center text-gray-500 py-10 bg-gray-50 rounded-lg border border-dashed">Nenhuma viagem encontrada.</div>`;
    } else {
        appData.trips.forEach(t => {
            html += `
                <div class="bg-white border rounded-lg shadow-sm hover:shadow-md transition p-4 relative group cursor-pointer" onclick="window.goTo('trip', '${t.id}')">
                    <h3 class="text-lg font-bold text-gray-800 pr-16">${t.name}</h3>
                    <p class="text-sm text-gray-500 mt-2">📅 ${t.days ? t.days.length : 0} dias</p>
                </div>`;
        });
    }
    html += `</div></div>`;
    const appEl = document.getElementById('app');
    if (appEl) appEl.innerHTML = html;
}

// LÓGICA DO MODAL DE VIAGEM AQUI DENTRO PARA EVITAR ERROS DE ARQUIVO
let editingTripId = null;

export function openTripModal(id = null) {
    editingTripId = id;
    const modal = document.getElementById('tripModal');
    const t = id ? appData.trips.find(x => x.id === id) : null;

    document.getElementById('tripModalTitle').innerText = t ? 'Editar Viagem' : 'Nova Viagem';
    document.getElementById('tripName').value = t ? t.name : '';
    document.getElementById('tripStart').value = t ? t.startDate : '';
    document.getElementById('tripEnd').value = t ? t.endDate : '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export async function saveTrip() {
    const name = document.getElementById('tripName').value.trim();
    const start = document.getElementById('tripStart').value;
    const end = document.getElementById('tripEnd').value;

    if (!name || !start || !end) return alert('Preencha todos os campos!');

    if (editingTripId) {
        const tripData = appData.trips.find(x => x.id === editingTripId);
        tripData.name = name; tripData.startDate = start; tripData.endDate = end;
    } else {
        const tripData = {
            id: Math.random().toString(36).substr(2, 9),
            name, startDate: start, endDate: end, days: [], hotels: [], extraCosts: [], rates: { USD: 0, EUR: 0, GBP: 0 }
        };
        let current = new Date(start + 'T00:00:00');
        const last = new Date(end + 'T00:00:00');
        while (current <= last) {
            tripData.days.push({
                id: Math.random().toString(36).substr(2, 9),
                date: current.toISOString().split('T')[0], attractions: [], transport: [], extraCosts: [], locations: []
            });
            current.setDate(current.getDate() + 1);
        }
        appData.trips.push(tripData);
    }
    await saveData();
    closeModals();
    render();
}

export async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed.trips) return alert('Arquivo de backup inválido.');
            if (!confirm(`Importar ${parsed.trips.length} viagem(ns)? Isso vai adicionar ao seu acervo atual.`)) return;
            const { appData, saveData } = await import('../store.js');
            appData.trips = [...appData.trips, ...parsed.trips];
            await saveData();
            render();
            alert('✅ Backup importado com sucesso!');
        } catch (err) {
            alert('Erro ao ler o arquivo: ' + err.message);
        }
    };
    reader.readAsText(file);
}

export async function deleteTrip(id) {
    if (!confirm('Apagar esta viagem permanentemente?')) return;
    const { appData, saveData } = await import('../store.js');
    appData.trips = appData.trips.filter(t => t.id !== id);
    await saveData();
    render();
}