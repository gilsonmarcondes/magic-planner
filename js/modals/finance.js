import { appData, currentState, saveData } from '../store.js';
import { randomId } from '../utils.js';

// --- CÂMBIO HISTÓRICO ---
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
}

export function switchFinanceTab(tab) {
    ['report', 'costs'].forEach(t => {
        document.getElementById(`tab-${t}`)?.classList.add('hidden');
        const btn = document.getElementById(`btn-tab-${t}`);
        if (btn) btn.className = "pb-2 font-bold text-xs uppercase tracking-widest text-gray-400";
    });
    document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-tab-${tab}`);
    if (activeBtn) activeBtn.className = "pb-2 font-bold text-xs uppercase tracking-widest border-b-2 border-blue-600 text-blue-600";
    if (tab === 'report') renderReport(); else if (tab === 'costs') renderInitialCostsList();
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
    saveData(); renderReport();
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
    saveData(); renderInitialCostsList(); renderReport();
}

export function deleteInitialCost(id) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.initialCosts = t.initialCosts.filter(c => c.id !== id);
    saveData(); renderInitialCostsList(); renderReport();
}

function renderInitialCostsList() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const el = document.getElementById('initialCostsList');
    if (!t || !el) return;
    el.innerHTML = (t.initialCosts || []).map(c => `
        <li class="flex justify-between items-center p-3 bg-white border rounded mb-2 text-sm shadow-sm">
            <span class="font-bold text-slate-700">${c.desc}</span>
            <div class="flex items-center gap-3">
                <span class="font-mono text-xs">${c.currency} ${parseFloat(c.value).toFixed(2)}</span>
                <button onclick="window.deleteInitialCost('${c.id}')" class="text-red-400 font-bold">×</button>
            </div>
        </li>`).join('');
}

// --- EXTRATO DETALHADO ---
export async function renderReport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    let res = { pago: { total: 0, itens: [] }, pendente: { total: 0, itens: [] } };
    const rate = (c) => getRate(c);

    // 1. Custos Iniciais (Sempre Pagos)
    (t.initialCosts || []).forEach(c => {
        const v = parseFloat(c.value) * rate(c.currency);
        res.pago.total += v;
        res.pago.itens.push({ desc: c.desc, v, orig: `${c.currency} ${c.value}`, cat: '📌 Inicial' });
    });

    // 2. Hotéis
    (t.hotels || []).forEach(h => {
        const v = parseFloat(h.cost) * rate(h.currency);
        const item = { desc: `Hotel: ${h.name}`, v, orig: `${h.currency} ${h.cost}`, cat: '🏨 Hotel' };
        h.paid ? (res.pago.total += v, res.pago.itens.push(item)) : (res.pendente.total += v, res.pendente.itens.push(item));
    });

    // 3. Dias (Atrações e Extras)
    (t.days || []).forEach(d => {
        d.attractions.forEach(a => {
            const v = (a.costs || []).reduce((acc, c) => acc + (parseFloat(c.value) * rate(c.currency)), 0);
            if (v > 0) {
                const item = { desc: a.name, v, cat: '🏰 Atração' };
                a.visited ? (res.pago.total += v, res.pago.itens.push(item)) : (res.pendente.total += v, res.pendente.itens.push(item));
            }
        });
        (d.extraCosts || []).forEach(ex => {
            const v = parseFloat(ex.value) * rate(ex.currency);
            res.pago.total += v;
            res.pago.itens.push({ desc: ex.desc, v, cat: '💸 Extra' });
        });
    });

    displayFinanceDetail(res);
}

function displayFinanceDetail(res) {
    const container = document.getElementById('tab-report');
    if (!container) return;

    const row = (i) => `
        <div class="flex justify-between items-center py-2 border-b border-gray-50 text-[11px]">
            <div class="flex flex-col">
                <span class="font-bold text-slate-700 leading-tight">${i.desc}</span>
                <span class="text-[9px] text-slate-400 uppercase font-semibold">${i.cat} ${i.orig ? '| ' + i.orig : ''}</span>
            </div>
            <span class="font-mono font-bold text-slate-600">R$ ${i.v.toFixed(2)}</span>
        </div>`;

    container.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-2 gap-2">
                <div class="bg-emerald-50 p-3 rounded-lg border-l-4 border-emerald-500">
                    <p class="text-[9px] font-bold text-emerald-700 uppercase">Já Pago</p>
                    <p class="text-lg font-mono font-bold text-emerald-900">R$ ${res.pago.total.toFixed(2)}</p>
                </div>
                <div class="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500">
                    <p class="text-[9px] font-bold text-amber-700 uppercase">Pendente</p>
                    <p class="text-lg font-mono font-bold text-amber-900">R$ ${res.pendente.total.toFixed(2)}</p>
                </div>
            </div>

            <div>
                <h4 class="text-[10px] font-bold text-slate-400 uppercase mb-2">📜 Extrato: Realizado</h4>
                <div class="bg-white rounded-lg border p-3 max-h-40 overflow-y-auto shadow-inner">
                    ${res.pago.itens.length ? res.pago.itens.map(row).join('') : '<p class="text-center text-gray-400 py-4 text-xs">Sem lançamentos.</p>'}
                </div>
            </div>

            <div>
                <h4 class="text-[10px] font-bold text-slate-400 uppercase mb-2">⏳ Extrato: A Pagar</h4>
                <div class="bg-white rounded-lg border p-3 max-h-40 overflow-y-auto shadow-inner">
                    ${res.pendente.itens.length ? res.pendente.itens.map(row).join('') : '<p class="text-center text-gray-400 py-4 text-xs">Tudo pago!</p>'}
                </div>
            </div>

            <div class="bg-slate-800 text-white p-5 rounded-xl text-center shadow-lg border-b-4 border-amber-500">
                <p class="text-[9px] uppercase opacity-60 tracking-tighter mb-1">Investimento Total da Viagem</p>
                <h2 class="text-4xl font-bold font-mono text-amber-400">R$ ${(res.pago.total + res.pendente.total).toFixed(2)}</h2>
            </div>
        </div>
    `;
}

export async function syncHistoricalRates() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const btn = document.getElementById('btnSyncRates');
    btn.innerText = '⌛...';
    for (let m of ['EUR', 'GBP', 'USD']) {
        const h = t.hotels?.find(h => h.paid && h.payDate && h.currency === m);
        if (h) {
            const r = await fetchHistoricalRate(m, h.payDate);
            if (r) t.rates[m] = r.toFixed(2);
        }
    }
    await saveData(); openFinanceModal(); btn.innerText = '🔄 Sincronizar por Datas';
}