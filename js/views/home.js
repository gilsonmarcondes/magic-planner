import { appData, saveData } from '../store.js';
import { render, goTo } from '../router.js';
import { closeModals } from '../utils.js';

// --- RENDERIZAÇÃO DA PÁGINA INICIAL ---
export function renderHome() {
    if (!appData.trips) appData.trips = [];
    
    let html = `
        <div class="p-4 max-w-5xl mx-auto animate-fade-in">
            <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 class="text-3xl font-magic font-bold text-[#0c4a6e] uppercase">Minhas Viagens</h2>
                <div class="flex gap-2">
                    <button onclick="window.createTrip()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md font-bold flex items-center">
                        <span class="mr-2 text-xl">+</span> Nova Viagem
                    </button>
                    <label class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition shadow-sm cursor-pointer font-bold text-sm flex items-center">
                        📂 Importar Backup
                        <input type="file" accept=".json" class="hidden" onchange="window.importData(event)">
                    </label>
                </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;

    if (appData.trips.length === 0) {
        html += `
            <div class="col-span-full text-center text-gray-400 py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <p class="text-lg">Nenhuma viagem planeada ainda.</p>
                <p class="text-sm">Clique em "+ Nova Viagem" para começar a mágica!</p>
            </div>`;
    } else {
        appData.trips.forEach(t => {
            html += `
                <div class="bg-white border-b-4 border-b-[#d4af37] rounded-xl shadow-sm hover:shadow-xl transition-all p-5 relative group cursor-pointer overflow-hidden" onclick="window.goTo('trip', '${t.id}')">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-[#0c4a6e] leading-tight pr-8">${t.name}</h3>
                        <button onclick="event.stopPropagation(); window.editTripMetadata('${t.id}')" class="text-gray-300 hover:text-blue-500 transition">✏️</button>
                    </div>
                    <p class="text-sm text-gray-500 font-medium">📅 ${t.days ? t.days.length : 0} dias de aventura</p>
                    <div class="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition">
                        <button onclick="event.stopPropagation(); window.deleteTrip('${t.id}')" class="text-xs text-red-400 hover:text-red-600 font-bold uppercase tracking-widest">Apagar</button>
                    </div>
                </div>`;
        });
    }

    html += `</div></div>`;
    const appEl = document.getElementById('app');
    if (appEl) appEl.innerHTML = html;
}

// --- FUNÇÕES EXPORTADAS PARA O MAIN.JS ---

export function createTrip() {
    // No seu sistema, o modal de criação está no index.html e é controlado pelo main/trip
    if (typeof window.openTripModal === 'function') {
        window.openTripModal();
    }
}

export function editTripMetadata(id) {
    if (typeof window.openTripModal === 'function') {
        window.openTripModal(id);
    }
}

export async function deleteTrip(id) {
    if (!confirm('Tem certeza que deseja apagar esta viagem para sempre?')) return;
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
            const imported = JSON.parse(e.target.result);
            if (imported.trips) {
                appData.trips = imported.trips;
                await saveData();
                alert('Backup importado com sucesso!');
                render();
            }
        } catch (err) {
            alert('Erro ao ler o arquivo de backup.');
        }
    };
    reader.readAsText(file);
}