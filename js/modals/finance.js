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

// --- NAVEGAÇÃO DO MODAL ---
export function openFinanceModal() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    // Preenche os campos de cotação com o que está salvo
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

// --- PERSISTÊNCIA DE TAXAS ---
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
    alert("Cotações salvas com sucesso!");
}

function getRate(curr) {
    if (!curr || curr === 'BRL') return 1;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const rate = parseFloat(t?.rates?.[curr]);
    return (rate && rate > 0) ? rate : 1; 
}

// --- GESTÃO DE CUSTOS INICIAIS ---
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
    document.getElementById('initDesc').value = '';
    document.getElementById('initVal').value = '';
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
        <li class="flex justify-between items-center p-3 bg-white border rounded shadow-sm mb-2">
            <div class="flex flex-col">
                <span class="font-bold text-slate-700">${c.desc}</span>
                <span class="text-[10px] text-slate-400 uppercase">${c.currency}</span>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-mono font-bold">R$ ${(parseFloat(c.value) * getRate(c.currency)).toFixed(2)}</span>
                <button onclick="window.deleteInitialCost('${c.id}')" class="text-red-400 text-xl">&times;</button>
            </div>
        </li>`).join('');
}

// --- RELATÓRIO PAGO VS PENDENTE ---
export async function renderReport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    let res = {
        pago: { inicial: 0, hoteis: 0, atracoes: 0, extras: 0, total: 0 },
        pendente: { hoteis: 0, atracoes: 0, total: 0 }
    };

    // 1. Iniciais (Considerados pagos)
    (t.initialCosts || []).forEach(c => res.pago.inicial += parseFloat(c.value || 0) * getRate(c.currency));

    // 2. Hotéis
    (t.hotels || []).forEach(h => {
        const v = parseFloat(h.cost || 0) * getRate(h.currency);
        h.paid ? res.pago.hoteis += v : res.pendente.hoteis += v;
    });

    // 3. Atrações e Extras do dia
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

export async function syncHistoricalRates() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    const btn = document.getElementById('btnSyncRates');
    const originalText = btn.innerText;
    btn.innerText = '⌛ Sincronizando...';

    const firstPaidEUR = t.hotels?.find(h => h.paid && h.payDate && h.currency === 'EUR');
    if (firstPaidEUR) {
        const rate = await fetchHistoricalRate('EUR', firstPaidEUR.payDate);
        if (rate) t.rates.EUR = rate.toFixed(2);
    }

    const firstPaidGBP = t.hotels?.find(h => h.paid && h.payDate && h.currency === 'GBP');
    if (firstPaidGBP) {
        const rate = await fetchHistoricalRate('GBP', firstPaidGBP.payDate);
        if (rate) t.rates.GBP = rate.toFixed(2);
    }

    await saveData();
    openFinanceModal(); // Recarrega os inputs com novos valores
    btn.innerText = originalText;
    alert("Câmbio sincronizado com as datas de pagamento!");
}

function displayFinanceData(res) {
    const container = document.getElementById('tab-report');
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-4 w-full">
            <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded shadow-sm">
                <h4 class="text-emerald-800 font-bold uppercase text-[10px] mb-2 tracking-widest">✅ Já Pago (Realizado)</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span>Iniciais & Extras:</span> <span class="font-mono font-bold">R$ ${(res.pago.inicial + res.pago.extras).toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Hotéis:</span> <span class="font-mono font-bold">R$ ${res.pago.hoteis.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Atrações:</span> <span class="font-mono font-bold">R$ ${res.pago.atracoes.toFixed(2)}</span></div>
                    <div class="flex justify-between border-t pt-2 text-emerald-900 font-bold text-lg"><span>TOTAL PAGO:</span> <span>R$ ${res.pago.total.toFixed(2)}</span></div>
                </div>
            </div>

            <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm">
                <h4 class="text-amber-800 font-bold uppercase text-[10px] mb-2 tracking-widest">⏳ Provisionado (A Pagar)</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span>Hotéis Pendentes:</span> <span class="font-mono font-bold">R$ ${res.pendente.hoteis.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Atrações Pendentes:</span> <span class="font-mono font-bold">R$ ${res.pendente.atracoes.toFixed(2)}</span></div>
                    <div class="flex justify-between border-t pt-2 text-amber-900 font-bold text-lg"><span>A PAGAR:</span> <span>R$ ${res.pendente.total.toFixed(2)}</span></div>
                </div>
            </div>

            <div class="bg-slate-800 text-white p-6 rounded-xl text-center shadow-xl border-b-4 border-amber-500">
                <p class="text-[10px] uppercase opacity-60 tracking-widest mb-1">Custo Total Estimado</p>
                <h2 class="text-4xl font-bold font-mono">R$ ${(res.pago.total + res.pendente.total).toFixed(2)}</h2>
            </div>
        </div>
    `;
}

// Exposição para os botões do HTML
window.syncHistoricalRates = syncHistoricalRates;
window.deleteInitialCost = deleteInitialCost;