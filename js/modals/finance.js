// --- MODAL: FINANÇAS COMPLETO ---
import { appData, currentState, saveData } from '../store.js';
import { randomId } from '../utils.js';

let financeChartInstance = null; // Variável para guardar o gráfico visual

export function openFinanceModal() {
    try {
        const t = appData.trips.find(x => x.id === currentState.tripId);
        if (!t) { alert("Erro: Viagem não encontrada."); return; }
        
        // Carrega as cotações guardadas
        if (document.getElementById('rateUSD')) document.getElementById('rateUSD').value = t.rates?.USD || '';
        if (document.getElementById('rateEUR')) document.getElementById('rateEUR').value = t.rates?.EUR || '';
        if (document.getElementById('rateGBP')) document.getElementById('rateGBP').value = t.rates?.GBP || '';
        
        const modal = document.getElementById('financeModal');
        if (modal) modal.classList.remove('hidden');
        
        switchFinanceTab('report');
        renderInitialCostsList();
    } catch (e) { console.error(e); }
}

export function closeFinanceModal() {
    window.closeModals();
}

export function switchFinanceTab(tab) {
    ['report', 'costs'].forEach(t => {
        const content = document.getElementById(`tab-${t}`);
        if (content) content.classList.add('hidden');
        const btn = document.getElementById(`btn-tab-${t}`);
        if (btn) { btn.classList.remove('border-b-2', 'border-blue-600', 'text-blue-600'); btn.classList.add('text-gray-500'); }
    });
    const activeContent = document.getElementById(`tab-${tab}`);
    if (activeContent) activeContent.classList.remove('hidden');
    
    const activeBtn = document.getElementById(`btn-tab-${tab}`);
    if (activeBtn) { activeBtn.classList.remove('text-gray-500'); activeBtn.classList.add('border-b-2', 'border-blue-600', 'text-blue-600'); }
    
    if (tab === 'report') renderReport();
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
    alert("Cotações Atualizadas!");
}

// O motor de conversão de moeda
function getRate(curr) {
    if (!curr || curr === 'BRL') return 1;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const rate = parseFloat(t?.rates?.[curr]);
    return (rate && rate > 0) ? rate : 1; 
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
        <li class="flex justify-between items-center p-2 bg-white border rounded shadow-sm">
            <span class="font-bold text-[#2c1a4d]">${c.desc}</span>
            <div class="flex items-center gap-4">
                <span class="font-mono text-sm">${c.currency} ${parseFloat(c.value).toFixed(2)}</span>
                <button onclick="window.deleteInitialCost('${c.id}')" class="text-red-400 font-bold hover:text-red-600">×</button>
            </div>
        </li>`).join('');
}

function renderReport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    
    let totalIniciais = 0, totalHoteis = 0, totalTransporte = 0, totalAtracoes = 0, totalExtras = 0;
    
    // 1. Custos Iniciais (Passagens aéreas, seguros, etc.)
    (t.initialCosts || []).forEach(c => totalIniciais += parseFloat(c.value || 0) * getRate(c.currency));
    
    // 2. Hotéis
    (t.hotels || []).forEach(h => totalHoteis += parseFloat(h.cost || 0) * getRate(h.currency));
    
    // 3. Varredura dos Dias (Transporte, Atrações e Extras)
    (t.days || []).forEach(d => {
        (d.transport || []).forEach(tr => totalTransporte += parseFloat(tr.cost || 0) * getRate(tr.currency));
        (d.attractions || []).forEach(a => (a.costs || []).forEach(c => totalAtracoes += parseFloat(c.value || 0) * getRate(c.currency)));
        (d.extraCosts || []).forEach(ex => totalExtras += parseFloat(ex.value || 0) * getRate(ex.currency));
    });

    const totalGeral = totalIniciais + totalHoteis + totalTransporte + totalAtracoes + totalExtras;
    const elTotal = document.getElementById('reportGrandTotal');
    if(elTotal) elTotal.innerText = `Total Estimado: R$ ${totalGeral.toFixed(2)}`; 
    
    // 4. Desenhar o Gráfico
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;
    
    if (financeChartInstance) financeChartInstance.destroy(); // Limpa o gráfico antigo
    
    financeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Custos Iniciais', 'Alojamento', 'Transporte', 'Atrações', 'Gastos Extras'],
            datasets: [{
                data: [totalIniciais, totalHoteis, totalTransporte, totalAtracoes, totalExtras],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
                borderWidth: 2
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}