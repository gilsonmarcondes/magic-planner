import { appData, currentState, saveData } from '../store.js';
import { randomId } from '../utils.js';

// Busca a cotação real de uma data específica (Histórico)
export async function fetchHistoricalRate(currency, date) {
    if (!date || currency === 'BRL') return 1;
    try {
        const response = await fetch(`https://api.frankfurter.app/${date}?from=${currency}&to=BRL`);
        const data = await response.json();
        return data.rates?.BRL || null;
    } catch (error) {
        console.error(`Erro na cotação (${currency}) em ${date}:`, error);
        return null;
    }
}

export function openFinanceModal() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    document.getElementById('rateUSD').value = t.rates?.USD || '';
    document.getElementById('rateEUR').value = t.rates?.EUR || '';
    document.getElementById('rateGBP').value = t.rates?.GBP || '';
    
    document.getElementById('financeModal').classList.remove('hidden');
    switchFinanceTab('report');
}

// Função auxiliar para decidir qual cotação usar
function getEffectiveRate(itemCurrency, itemDate, tripRates) {
    if (!itemCurrency || itemCurrency === 'BRL') return 1;
    // Se o item tiver uma cotação específica salva (pela busca histórica), usamos ela
    // Caso contrário, usamos a cotação padrão da viagem
    return tripRates?.[itemCurrency] || 1;
}

export async function renderReport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    let res = {
        pago: { inicial: 0, hoteis: 0, atracoes: 0, extras: 0, total: 0 },
        pendente: { hoteis: 0, atracoes: 0, total: 0 }
    };

    // 1. Custos Iniciais
    (t.initialCosts || []).forEach(c => {
        res.pago.inicial += parseFloat(c.value || 0) * getEffectiveRate(c.currency, null, t.rates);
    });

    // 2. Hotéis
    for (const h of (t.hotels || [])) {
        const valorBRL = parseFloat(h.cost || 0) * getEffectiveRate(h.currency, h.payDate, t.rates);
        h.paid ? res.pago.hoteis += valorBRL : res.pendente.hoteis += valorBRL;
    }

    // 3. Atrações e Extras
    for (const d of (t.days || [])) {
        for (const a of d.attractions) {
            const custoAttBRL = (a.costs || []).reduce((acc, c) => 
                acc + (parseFloat(c.value || 0) * getEffectiveRate(c.currency, d.date, t.rates)), 0);
            a.visited ? res.pago.atracoes += custoAttBRL : res.pendente.atracoes += custoAttBRL;
        }
        (d.extraCosts || []).forEach(ex => {
            res.pago.extras += parseFloat(ex.value || 0) * getEffectiveRate(ex.currency, d.date, t.rates);
        });
    }

    res.pago.total = res.pago.inicial + res.pago.hoteis + res.pago.atracoes + res.pago.extras;
    res.pendente.total = res.pendente.hoteis + res.pendente.atracoes;

    displayFinanceData(res);
}

// Função para atualizar as cotações base baseadas nas datas de pagamento
export async function syncHistoricalRates() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    const btn = document.getElementById('btnSyncRates');
    btn.innerText = '⌛ Sincronizando...';

    // Exemplo: Atualiza a cotação do Euro baseada no primeiro hotel pago
    const firstPaidHotel = t.hotels?.find(h => h.paid && h.payDate && h.currency === 'EUR');
    if (firstPaidHotel) {
        const rate = await fetchHistoricalRate('EUR', firstPaidHotel.payDate);
        if (rate) {
            t.rates.EUR = rate.toFixed(2);
            document.getElementById('rateEUR').value = t.rates.EUR;
        }
    }

    // Repete para Libra (GBP)
    const firstPaidGBP = t.hotels?.find(h => h.paid && h.payDate && h.currency === 'GBP');
    if (firstPaidGBP) {
        const rate = await fetchHistoricalRate('GBP', firstPaidGBP.payDate);
        if (rate) {
            t.rates.GBP = rate.toFixed(2);
            document.getElementById('rateGBP').value = t.rates.GBP;
        }
    }

    await saveData();
    renderReport();
    btn.innerText = '🔄 Sincronizar Câmbio';
    alert("Cotações atualizadas com base nas datas de pagamento!");
}

function displayFinanceData(res) {
    const container = document.getElementById('tab-report');
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-4 w-full">
            <button id="btnSyncRates" onclick="window.syncHistoricalRates()" class="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition mb-2">
                🔄 Sincronizar Câmbio por Datas
            </button>
            <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm">
                <h4 class="text-green-800 font-bold uppercase text-[10px] mb-2">✅ Realizado (Pago)</h4>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between"><span>Iniciais:</span> <span class="font-mono font-bold">R$ ${res.pago.inicial.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Hotéis:</span> <span class="font-mono font-bold">R$ ${res.pago.hoteis.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Atrações:</span> <span class="font-mono font-bold">R$ ${res.pago.atracoes.toFixed(2)}</span></div>
                    <div class="flex justify-between border-t pt-1 text-green-900 font-bold"><span>TOTAL:</span> <span>R$ ${res.pago.total.toFixed(2)}</span></div>
                </div>
            </div>
            <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm">
                <h4 class="text-amber-800 font-bold uppercase text-[10px] mb-2">⏳ Provisionado (A Pagar)</h4>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between"><span>Hotéis:</span> <span class="font-mono font-bold">R$ ${res.pendente.hoteis.toFixed(2)}</span></div>
                    <div class="flex justify-between"><span>Atrações:</span> <span class="font-mono font-bold">R$ ${res.pendente.atracoes.toFixed(2)}</span></div>
                    <div class="flex justify-between border-t pt-1 text-amber-900 font-bold"><span>RESTANTE:</span> <span>R$ ${res.pendente.total.toFixed(2)}</span></div>
                </div>
            </div>
            <div class="bg-slate-800 text-white p-4 rounded-lg text-center shadow-lg">
                <p class="text-[10px] uppercase opacity-70">Total da Aventura</p>
                <h2 class="text-3xl font-bold font-mono">R$ ${(res.pago.total + res.pendente.total).toFixed(2)}</h2>
            </div>
        </div>
    `;
}

// Exposição para o global
window.syncHistoricalRates = syncHistoricalRates;