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

// --- INTERFACE DO MODAL ---
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

// --- GESTÃO DE DADOS (O que estava causando o erro) ---
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
    alert("Cotações salvas!");
}

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

// --- RELATÓRIO PAGO VS PENDENTE ---
export async function renderReport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    let res = {
        pago: { inicial: 0, hoteis: 0, atracoes: 0, extras: 0, total: 0 },
        pendente: { hoteis: 0, atracoes: 0, total: 0 }
    };

    const getRate = (curr) => parseFloat(t.rates?.[curr]) || 1;

    (t.initialCosts || []).forEach(c => res.pago.inicial += parseFloat(c.value || 0) * getRate(c.currency));

    (t.hotels || []).forEach(h => {
        const v = parseFloat(h.cost || 0) * getRate(h.currency);
        h.paid ? res.pago.hoteis += v : res.pendente.hoteis += v;
    });

    (t.days || []).forEach(d => {
        d.attractions.forEach(a => {
            const v = (a.costs || []).reduce((acc, c) => acc + (parseFloat(c.value || 0) * getRate(c.currency)), 0);
            a.visited ? res.pago.atracoes += v : res.pendente.atracoes += v;
        });
        (d.extraCosts || []).forEach(ex => res.pago.extras += parseFloat(ex.value || 0) * getRate(ex.currency));
    });

    res.pago.total = res.pago.inicial + res.pago.hoteis + res.pago.atracoes + res.pago.extras;
    res.pendente.total = res.pendente.hoteis + res.pendente.atracoes;

    displayFinanceData(res);
}

// Sincroniza câmbio histórico
export async function syncHistoricalRates() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    const btn = document.getElementById('btnSyncRates');
    btn.innerText = '⌛...';

    const firstPaidEUR = t.hotels?.find(h => h.paid && h.payDate && h.currency === 'EUR');
    if (firstPaidEUR) {
        const rate = await fetchHistoricalRate('EUR', firstPaidEUR.payDate);
        if (rate) t.rates.EUR = rate.toFixed(2);
    }

    await saveData();
    openFinanceModal(); 
    btn.innerText = '🔄 Sincronizar';
}

// Renderização interna (não exportada)
function renderInitialCostsList() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const el = document.getElementById('initialCostsList');
    if (!t || !el) return;
    el.innerHTML = (t.initialCosts || []).map(c => `
        <li class="flex justify-between p-2 border-b text-sm">
            <span>${c.desc}</span>
            <button onclick="window.deleteInitialCost('${c.id}')" class="text-red-400">×</button>
        </li>`).join('');
}

function displayFinanceData(res) {
    const container = document.getElementById('tab-report');
    if (container) {
        container.innerHTML = `
            <div class="space-y-3 mt-4">
                <div class="p-3 bg-green-50 rounded border-l-4 border-green-500">
                    <p class="text-[10px] uppercase font-bold text-green-700">✅ Pago: R$ ${res.pago.total.toFixed(2)}</p>
                </div>
                <div class="p-3 bg-amber-50 rounded border-l-4 border-amber-500">
                    <p class="text-[10px] uppercase font-bold text-amber-700">⏳ Pendente: R$ ${res.pendente.total.toFixed(2)}</p>
                </div>
                <div class="p-4 bg-slate-800 text-white rounded text-center">
                    <h2 class="text-2xl font-mono">Total: R$ ${(res.pago.total + res.pendente.total).toFixed(2)}</h2>
                </div>
            </div>`;
    }
}