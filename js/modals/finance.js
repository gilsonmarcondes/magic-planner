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

// --- RELATÓRIO DETALHADO (RESUMO + LISTA) ---
export async function renderReport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    let res = {
        pago: { total: 0, itens: [] },
        pendente: { total: 0, itens: [] }
    };

    const getRate = (curr) => parseFloat(t.rates?.[curr]) || 1;

    // 1. Custos Iniciais (Considerados Pagos)
    (t.initialCosts || []).forEach(c => {
        const valorBRL = parseFloat(c.value || 0) * getRate(c.currency);
        res.pago.total += valorBRL;
        res.pago.itens.push({ desc: c.desc, valor: valorBRL, original: `${c.currency} ${c.value}`, cat: '📌 Inicial' });
    });

    // 2. Hotéis
    (t.hotels || []).forEach(h => {
        const valorBRL = parseFloat(h.cost || 0) * getRate(h.currency);
        const item = { desc: `Hotel: ${h.name}`, valor: valorBRL, original: `${h.currency} ${h.cost}`, cat: '🏨 Hospedagem' };
        if (h.paid) {
            res.pago.total += valorBRL;
            res.pago.itens.push(item);
        } else {
            res.pendente.total += valorBRL;
            res.pendente.itens.push(item);
        }
    });

    // 3. Atrações e Extras do dia
    (t.days || []).forEach(d => {
        // Atrações
        d.attractions.forEach(a => {
            const valorBRL = (a.costs || []).reduce((acc, c) => acc + (parseFloat(c.value || 0) * getRate(c.currency)), 0);
            if (valorBRL > 0) {
                const item = { desc: a.name, valor: valorBRL, cat: '🏰 Atração' };
                if (a.visited) {
                    res.pago.total += valorBRL;
                    res.pago.itens.push(item);
                } else {
                    res.pendente.total += valorBRL;
                    res.pendente.itens.push(item);
                }
            }
        });
        // Extras
        (d.extraCosts || []).forEach(ex => {
            const valorBRL = parseFloat(ex.value || 0) * getRate(ex.currency);
            res.pago.total += valorBRL;
            res.pago.itens.push({ desc: ex.desc, valor: valorBRL, cat: '💸 Extra' });
        });
    });

    displayFinanceData(res);
}

function displayFinanceData(res) {
    const container = document.getElementById('tab-report');
    if (!container) return;

    // Função auxiliar para gerar as linhas da lista
    const renderRows = (itens) => itens.map(i => `
        <div class="flex justify-between items-center py-2 border-b border-gray-100 text-[11px]">
            <div class="flex flex-col">
                <span class="font-bold text-slate-700">${i.desc}</span>
                <span class="text-[9px] text-slate-400 uppercase">${i.cat} ${i.original ? '| ' + i.original : ''}</span>
            </div>
            <span class="font-mono font-bold text-slate-600">R$ ${i.valor.toFixed(2)}</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="space-y-6 w-full pb-10">
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-emerald-50 p-3 rounded-lg border-l-4 border-emerald-500">
                    <p class="text-[9px] font-bold text-emerald-700 uppercase">Total Pago</p>
                    <p class="text-lg font-mono font-bold text-emerald-900">R$ ${res.pago.total.toFixed(2)}</p>
                </div>
                <div class="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500">
                    <p class="text-[9px] font-bold text-amber-700 uppercase">A Pagar</p>
                    <p class="text-lg font-mono font-bold text-amber-900">R$ ${res.pendente.total.toFixed(2)}</p>
                </div>
            </div>

            <div>
                <h4 class="text-[10px] font-bold text-slate-400 uppercase border-b mb-2 pb-1">📜 Detalhamento: Realizado</h4>
                <div class="bg-white rounded border px-3 max-h-48 overflow-y-auto">
                    ${res.pago.itens.length ? renderRows(res.pago.itens) : '<p class="py-4 text-center text-gray-400 text-xs">Nenhum gasto realizado.</p>'}
                </div>
            </div>

            <div>
                <h4 class="text-[10px] font-bold text-slate-400 uppercase border-b mb-2 pb-1">⏳ Detalhamento: Provisionado</h4>
                <div class="bg-white rounded border px-3 max-h-48 overflow-y-auto">
                    ${res.pendente.itens.length ? renderRows(res.pendente.itens) : '<p class="py-4 text-center text-gray-400 text-xs">Tudo pago!</p>'}
                </div>
            </div>

            <div class="bg-slate-800 text-white p-5 rounded-xl text-center shadow-lg border-b-4 border-amber-500">
                <p class="text-[10px] uppercase opacity-60 mb-1">Custo Estimado da Viagem</p>
                <h2 class="text-4xl font-bold font-mono">R$ ${(res.pago.total + res.pendente.total).toFixed(2)}</h2>
            </div>
        </div>
    `;
}