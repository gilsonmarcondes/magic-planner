import { appData, currentState, saveData } from '../store.js';
import { randomId } from '../utils.js';

// --- COTAÇÕES HISTÓRICAS ---
export async function fetchHistoricalRate(currency, date) {
    if (!date || currency === 'BRL') return 1;
    try {
        const response = await fetch(`https://api.frankfurter.app/${date}?from=${currency}&to=BRL`);
        const data = await response.json();
        return data.rates?.BRL || null;
    } catch (e) { return null; }
}

// --- NAVEGAÇÃO E INTERFACE ---
export function openFinanceModal() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    
    if (document.getElementById('rateUSD')) document.getElementById('rateUSD').value = t.rates?.USD || '';
    if (document.getElementById('rateEUR')) document.getElementById('rateEUR').value = t.rates?.EUR || '';
    if (document.getElementById('rateGBP')) document.getElementById('rateGBP').value = t.rates?.GBP || '';
    
    document.getElementById('financeModal').classList.remove('hidden');
    switchFinanceTab('report');
    renderInitialCostsList();
}

export function switchFinanceTab(tab) {
    ['report', 'costs'].forEach(t => {
        document.getElementById(`tab-${t}`)?.classList.add('hidden');
        document.getElementById(`btn-tab-${t}`)?.classList.remove('border-b-2', 'border-blue-600', 'text-blue-600');
    });
    document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    document.getElementById(`btn-tab-${tab}`)?.classList.add('border-b-2', 'border-blue-600', 'text-blue-600');
    if (tab === 'report') renderReport();
}

// --- PERSISTÊNCIA E CÁLCULOS ---
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
}

function getRate(curr) {
    if (!curr || curr === 'BRL') return 1;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    return parseFloat(t?.rates?.[curr]) || 1;
}

// --- GESTÃO DE CUSTOS (IMPORTANTE: Exportado!) ---
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

function renderInitialCostsList() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const el = document.getElementById('initialCostsList');
    if (!t || !el) return;
    el.innerHTML = (t.initialCosts || []).map(c => `
        <li class="flex justify-between p-2 border-b">
            <span>${c.desc}</span>
            <button onclick="window.deleteInitialCost('${c.id}')" class="text-red-400">×</button>
        </li>`).join('');
}

// --- RELATÓRIO E SINCRONIA ---
export async function renderReport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    // ... lógica de cálculo aqui (simplificada para o exemplo)
}

export async function syncHistoricalRates() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    // ... lógica de sincronia aqui
}

// Exposição global para o HTML
window.deleteInitialCost = deleteInitialCost;
window.syncHistoricalRates = syncHistoricalRates;