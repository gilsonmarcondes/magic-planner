import { appData, currentState, saveData } from '../store.js';
import { randomId } from '../utils.js';

// --- COTAÇÕES ---
export async function fetchHistoricalRate(currency, date) {
    if (!date || currency === 'BRL') return 1;
    try {
        const response = await fetch(`https://api.frankfurter.app/${date}?from=${currency}&to=BRL`);
        const data = await response.json();
        return data.rates?.BRL || null;
    } catch (e) { return null; }
}

export function saveRates() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    t.rates = { 
        USD: document.getElementById('rateUSD')?.value || '', 
        EUR: document.getElementById('rateEUR')?.value || '', 
        GBP: document.getElementById('rateGBP')?.value || '' 
    };
    saveData(); 
    renderReport();
    alert("Cotações Salvas!");
}

// --- GESTÃO DE CUSTOS INICIAIS (O que causou o erro) ---
export function addInitialCost() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    if (!t.initialCosts) t.initialCosts = []; 
    t.initialCosts.push({
        id: randomId(),
        desc: document.getElementById('initDesc')?.value || '',
        currency: document.getElementById('initCurr')?.value || 'BRL',
        value: document.getElementById('initVal')?.value || '0'
    });
    saveData(); 
    renderInitialCostsList();
}

export function deleteInitialCost(id) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if(t) t.initialCosts = (t.initialCosts || []).filter(c => c.id !== id);
    saveData(); 
    renderInitialCostsList();
}

// --- INTERFACE ---
export function openFinanceModal() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    document.getElementById('financeModal').classList.remove('hidden');
    switchFinanceTab('report');
    renderInitialCostsList();
}

export function switchFinanceTab(tab) {
    ['report', 'costs'].forEach(t => document.getElementById(`tab-${t}`)?.classList.add('hidden'));
    document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    if (tab === 'report') renderReport();
}

function renderInitialCostsList() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const el = document.getElementById('initialCostsList');
    if (!t || !el) return;
    el.innerHTML = (t.initialCosts || []).map(c => `
        <li class="flex justify-between p-2 bg-white border rounded mb-2">
            <span>${c.desc}</span>
            <button onclick="window.deleteInitialCost('${c.id}')" class="text-red-400">×</button>
        </li>`).join('');
}

export async function renderReport() {
    // Sua lógica de cálculo (Pago vs Pendente) aqui...
    console.log("Gerando relatório...");
}