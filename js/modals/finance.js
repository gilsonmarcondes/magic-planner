// --- MODAL: FINANÇAS COMPLETO ---
import { appData, currentState, myFinanceChart, myMonthlyChart, saveData,
         setMyFinanceChart, setMyMonthlyChart } from '../store.js';
import { formatDateBr, randomId } from '../utils.js';

// FUNÇÃO PARA ABRIR
export function openFinanceModal() {
    try {
        const t = appData.trips.find(x => x.id === currentState.tripId);
        if (!t) { alert("Erro: Viagem não encontrada."); return; }
        
        if (document.getElementById('rateUSD')) document.getElementById('rateUSD').value = t.rates?.USD || '';
        if (document.getElementById('rateEUR')) document.getElementById('rateEUR').value = t.rates?.EUR || '';
        if (document.getElementById('rateGBP')) document.getElementById('rateGBP').value = t.rates?.GBP || '';
        
        const modal = document.getElementById('financeModal');
        if (modal) {
            modal.classList.remove('hidden'); // PADRONIZADO!
        }
        
        switchFinanceTab('report');
        renderInitialCostsList();
    } catch (e) {
        console.error(e);
    }
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
    
    if (tab === 'report')  renderReport();
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
                <span>${c.currency} ${parseFloat(c.value).toFixed(2)}</span>
                <button onclick="window.deleteInitialCost('${c.id}')" class="text-red-400 font-bold">×</button>
            </div>
        </li>`).join('');
}

function renderReport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    const elTotal = document.getElementById('reportGrandTotal');
    if(elTotal) elTotal.innerText = "Relatório Atualizado"; 
}