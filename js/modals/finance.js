// --- MODAL: FINANCE ---
import { appData, currentState, saveData } from '../store.js';
import { closeModals } from '../utils.js';

export function openFinanceModal() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return alert('Selecione uma viagem primeiro para ver as finanças.');
    
    // Preenche as cotações
    document.getElementById('rateUSD').value = t.rates?.USD || 0;
    document.getElementById('rateEUR').value = t.rates?.EUR || 0;
    document.getElementById('rateGBP').value = t.rates?.GBP || 0;

    renderInitialCosts(t);
    document.getElementById('financeModal').classList.remove('hidden');
}

function renderInitialCosts(t) {
    const list = document.getElementById('initialCostsList');
    if (!list) return;
    
    const costs = t.initialCosts || [];
    list.innerHTML = costs.map((c, i) => `
        <div class="flex justify-between items-center p-2 border-b border-dashed text-sm">
            <span class="font-medium">${c.desc}</span>
            <div class="flex items-center gap-3">
                <span class="text-gray-600">${c.currency} ${parseFloat(c.value).toFixed(2)}</span>
                <button onclick="window.deleteInitialCost(${i})" class="text-red-400 hover:text-red-600 text-lg">×</button>
            </div>
        </div>`).join('');
}

export async function saveRates() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;

    t.rates = {
        USD: document.getElementById('rateUSD').value,
        EUR: document.getElementById('rateEUR').value,
        GBP: document.getElementById('rateGBP').value
    };
    
    await saveData();
    const btn = document.querySelector('button[onclick="window.saveRates()"]');
    if (btn) {
        const orig = btn.innerText;
        btn.innerText = '✅ Salvo!';
        setTimeout(() => btn.innerText = orig, 1500);
    }
}

export async function addInitialCost() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const desc = prompt('O que é este gasto? (Ex: Passagens, Seguro...)');
    if (!desc) return;
    const value = prompt('Qual o valor?');
    if (!value || isNaN(value)) return alert('Valor inválido.');

    if (!t.initialCosts) t.initialCosts = [];
    t.initialCosts.push({ desc, value, currency: 'BRL' });
    
    await saveData();
    renderInitialCosts(t);
}

export async function deleteInitialCost(index) {
    if (!confirm('Excluir este custo inicial?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.initialCosts.splice(index, 1);
    await saveData();
    renderInitialCosts(t);
}

export function switchFinanceTab(tab) {
    // Esconde todas as abas
    document.querySelectorAll('.fin-tab').forEach(el => el.classList.add('hidden'));
    // Mostra a selecionada
    const target = document.getElementById('tab-' + tab);
    if (target) target.classList.remove('hidden');
}

// Expõe para o escopo global o que o HTML precisa
Object.assign(window, {
    saveRates, addInitialCost, deleteInitialCost, switchFinanceTab
});