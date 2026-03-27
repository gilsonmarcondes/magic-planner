import { appData, saveData } from '../store.js';
import { render, goTo } from '../router.js';

// Substitua a função renderHome no seu home.js por esta completa:
export function renderHome() {
    if (!appData.trips) appData.trips = [];
    
    let html = `
        <div class="p-4 max-w-5xl mx-auto">
            <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 class="text-2xl font-bold text-[#0c4a6e]">Minhas Viagens</h2>
                <div class="flex gap-2">
                    <button onclick="window.openTripModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition shadow flex items-center">
                        <span class="text-white font-bold mr-2 text-xl">+</span> Nova Viagem
                    </button>
                    <label class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition shadow cursor-pointer text-sm">
                        📂 Importar Backup
                        <input type="file" accept=".json" class="hidden" onchange="window.importData(event)">
                    </label>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    `;

    if (appData.trips.length === 0) {
        html += `<div class="col-span-full text-center text-gray-500 py-10 bg-gray-50 rounded-lg border border-dashed">Nenhuma viagem encontrada.</div>`;
    } else {
        appData.trips.forEach(t => {
            html += `
                <div class="bg-white border rounded-lg shadow-sm hover:shadow-md transition p-4 relative group cursor-pointer" onclick="window.goTo('trip', '${t.id}')">
                    <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onclick="event.stopPropagation(); window.openTripModal('${t.id}')" class="text-blue-600 bg-blue-50 rounded p-1.5 hover:bg-blue-100" title="Editar">✏️</button>
                        <button onclick="event.stopPropagation(); window.deleteTrip('${t.id}')" class="text-red-600 bg-red-50 rounded p-1.5 hover:bg-red-100" title="Excluir">🗑️</button>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 pr-16">${t.name}</h3>
                    <p class="text-sm text-gray-500 mt-2">📅 ${t.days ? t.days.length : 0} dias de roteiro</p>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    document.getElementById('app').innerHTML = html;
}

export async function createTrip() {} // Usamos o modal em modals/trip.js

export async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.trips) {
                appData.trips = imported.trips;
                await saveData();
                alert('✅ Backup importado!');
                render();
            }
        } catch (err) { alert('Erro ao ler JSON.'); }
    };
    reader.readAsText(file);
}

export async function deleteTrip(id) {
    if (!confirm('Excluir permanentemente?')) return;
    appData.trips = appData.trips.filter(x => x.id !== id);
    await saveData();
    render();
}