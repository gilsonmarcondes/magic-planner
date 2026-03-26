import { appData, currentState, saveData } from '../store.js';
import { randomId, closeModals } from '../utils.js';

// --- API DE CÂMBIO HISTÓRICO ---
export async function fetchHistoricalRate(currency, date) {
    if (!date || currency === 'BRL') return 1;
    try {
        const response = await fetch(`https://api.frankfurter.app/${date}?from=${currency}&to=BRL`);
        const data = await response.json();
        return data.rates?.BRL || null;
    } catch (e) { return null; }
}

// --- INTERFACE ---
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
        const btn = document.getElementById(`btn-tab-${t}`);
        if (btn) btn.className = "pb-2 font-bold text-sm uppercase tracking-wider text-gray-400";
    });
    
    document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-tab-${tab}`);
    if (activeBtn) activeBtn.className = "pb-2 font-bold text-sm uppercase tracking-wider border-b-2 border-blue-600 text-blue-600";
    
    if (tab === 'report') renderReport();
}

// --- CÁLCULOS ---
function getRate(curr) {
    if (!curr || curr === 'BRL') return 1;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    return parseFloat(t?.rates?.[curr]) || 1;
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
}

export async function syncHistoricalRates() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    const btn = document.getElementById('btnSyncRates');
    btn.innerText = '⌛ Sincronizando...';

    // Sincroniza baseado no primeiro hotel pago de cada moeda
    for (let m of ['EUR', 'GBP', 'USD']) {
        const firstPaid = t.hotels?.find(h => h.paid && h.payDate && h.currency === m);
        if (firstPaid) {
            const rate = await fetchHistoricalRate(m, firstPaid.payDate);
            if (rate) t.rates[m] = rate.toFixed(2);
        }
    }

    await saveData();
    openFinanceModal(); 
    btn.innerText = '🔄 Sincronizar por Datas';
    alert("Câmbio atualizado com base nas datas de pagamento!");
}

// --- GESTÃO DE CUSTOS INICIAIS ---
export function addInitialCost() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    if (!t.initialCosts) t.initialCosts = []; 
    t.initialCosts.push({
        id: randomId(),
        desc: document.getElementById('initDesc').value,
        currency: document.getElementById('initCurr').value,
        value: document.getElementById('initVal').value || 0
    });
    saveData(); 
    renderInitialCostsList();
    renderReport();
}

export function deleteInitialCost(id) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.initialCosts = t.initialCosts.filter(c => c.id !== id);
    saveData(); 
    renderInitialCostsList();
    renderReport();
}

function renderInitialCostsList() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const el = document.getElementById('initialCostsList');
    if (!t || !el) return;
    el.innerHTML = (t.initialCosts || []).map(c => `
        <li class="flex justify-between items-center p-3 bg-gray-50 border rounded shadow-sm">
            <span class="font-bold text-slate-700 text-sm">${c.desc}</span>
            <div class="flex items-center gap-4">
                <span class="font-mono text-xs font-bold">${c.currency} ${parseFloat(c.value).toFixed(2)}</span>
                <button onclick="window.deleteInitialCost('${c.id}')" class="text-red-500 text-xl font-bold">&times;</button>
            </div>
        </li>`).join('');
}

// --- RELATÓRIO PAGO VS PENDENTE ---
export async function renderReport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    let res = {
        pago: { inicial: 0, hoteis: 0, atracoes: 0, total: 0 },
        pendente: { hoteis: 0, atracoes: 0, total: 0 }
    };

    (t.initialCosts || []).forEach(c => res.pago.inicial += parseFloat(c.value) * getRate(c.currency));

    (t.hotels || []).forEach(h => {
        const v = parseFloat(h.cost) * getRate(h.currency);
        h.paid ? res.pago.hoteis += v : res.pendente.hoteis += v;
    });

    (t.days || []).forEach(d => {
        d.attractions.forEach(a => {
            const v = (a.costs || []).reduce((acc, c) => acc + (parseFloat(c.value) * getRate(c.currency)), 0);
            a.visited ? res.pago.atracoes += v : res.pendente.atracoes += v;
        });
        (d.extraCosts || []).forEach(ex => res.pago.inicial += parseFloat(ex.value) * getRate(ex.currency));
    });

    res.pago.total = res.pago.inicial + res.pago.hoteis + res.pago.atracoes;
    res.pendente.total = res.pendente.hoteis + res.pendente.atracoes;

    const container = document.getElementById('tab-report');
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-4">
            <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded shadow-sm">
                <h4 class="text-emerald-800 font-bold uppercase text-[10px] mb-2 tracking-widest">✅ Já Pago (Realizado)</h4>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between"><span>Custos Iniciais:</span> <span class="font-mono font-bold">R$ ${res.pago.inicial.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Hotéis Pagos:</span> <span class="font-mono font-bold">R$ ${res.pago.hoteis.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Atrações Visitadas:</span> <span class="font-mono font-bold">R$ ${res.pago.atracoes.toFixed(2)}</span></div>
                    <div class="flex justify-between border-t pt-2 text-emerald-900 font-bold text-lg"><span>TOTAL:</span> <span>R$ ${res.pago.total.toFixed(2)}</span></div>
                </div>
            </div>

            <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm">
                <h4 class="text-amber-800 font-bold uppercase text-[10px] mb-2 tracking-widest">⏳ Provisionado (Pendente)</h4>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between"><span>Hotéis a Pagar:</span> <span class="font-mono font-bold">R$ ${res.pendente.hoteis.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Atrações a Visitar:</span> <span class="font-mono font-bold">R$ ${res.pendente.atracoes.toFixed(2)}</span></div>
                    <div class="flex justify-between border-t pt-2 text-amber-900 font-bold text-lg"><span>A PAGAR:</span> <span>R$ ${res.pendente.total.toFixed(2)}</span></div>
                </div>
            </div>

            <div class="bg-slate-800 text-white p-6 rounded-xl text-center shadow-xl">
                <p class="text-[10px] uppercase opacity-60 tracking-widest mb-1">Custo Total Estimado</p>
                <h2 class="text-4xl font-bold font-mono text-amber-400">R$ ${(res.pago.total + res.pendente.total).toFixed(2)}</h2>
            </div>
        </div>
    `;
}