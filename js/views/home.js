// --- VIEW: HOME ---
import { appData, saveData } from '../store.js';
import { render, goTo } from '../router.js';
import { randomId } from '../utils.js';

// 👉 A função que faltava para desenhar a tela:
export function renderHome() {
    if (!appData.trips) appData.trips = [];
    
    let html = `
        <div class="p-4 max-w-5xl mx-auto">
            <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 class="text-2xl font-bold text-[#0c4a6e]">Minhas Viagens</h2>
                <div class="flex gap-2">
                    <button onclick="window.createTrip()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition shadow text-sm md:text-base">➕ Nova Viagem</button>
                    <label class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition shadow cursor-pointer text-sm md:text-base">
                        📂 Importar Backup
                        <input type="file" accept=".json" class="hidden" onchange="window.importData(event)">
                    </label>
                </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    `;

    if (appData.trips.length === 0) {
        html += `<div class="col-span-full text-center text-gray-500 py-10 bg-gray-50 rounded-lg border border-dashed">Nenhuma viagem encontrada. Crie uma nova ou importe o seu arquivo JSON!</div>`;
    } else {
        appData.trips.forEach(t => {
            html += `
                <div class="bg-white border rounded-lg shadow-sm hover:shadow-md transition p-4 relative group cursor-pointer" onclick="window.goTo('trip', '${t.id}')">
                    <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onclick="event.stopPropagation(); window.editTripMetadata('${t.id}')" class="text-blue-600 bg-blue-50 rounded p-1.5 hover:bg-blue-100" title="Renomear">✏️</button>
                        <button onclick="event.stopPropagation(); window.deleteTrip('${t.id}')" class="text-red-600 bg-red-50 rounded p-1.5 hover:bg-red-100" title="Excluir">🗑️</button>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 pr-16">${t.name}</h3>
                    <p class="text-sm text-gray-500 mt-2">📅 ${t.days ? t.days.length : 0} dias de roteiro</p>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    
    const appEl = document.getElementById('app');
    if (appEl) appEl.innerHTML = html;
    
    return html;
}

export async function createTrip() {
    const name = prompt('Nome da Viagem:');
    if (!name) return;
    const newTrip = {
        id: randomId(),
        name: name,
        days: [],
        hotels: [],
        initialCosts: [],
        checklist: [],
        rates: { USD: 0, EUR: 0, GBP: 0 }
    };
    appData.trips.push(newTrip);
    await saveData(); // Salva na nuvem
    render();
}

export async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported && imported.trips) {
                appData.trips = imported.trips;
                await saveData(); // ☁️ Sobe para o Firebase na hora!
                alert('✅ Mágica feita! Viagens importadas e salvas na nuvem com sucesso!');
                render();
            } else {
                alert('Arquivo inválido: Não encontramos a lista de viagens.');
            }
        } catch (err) {
            console.error('Erro na leitura:', err);
            alert('Erro ao ler o arquivo. Verifique se é um JSON válido.');
        }
    };
    reader.readAsText(file);
}

export function editTripMetadata(id) {
    const t = appData.trips.find(x => x.id === id);
    const newName = prompt('Novo nome da viagem:', t.name);
    if (newName) {
        t.name = newName;
        saveData();
        render();
    }
}

export async function deleteTrip(id) {
    if (!confirm('Tem certeza que deseja excluir esta viagem permanentemente?')) return;
    appData.trips = appData.trips.filter(x => x.id !== id);
    await saveData();
    render();
}