// --- MODAL: ATTRACTION ---
import { appData, currentState, saveData, getAttractionQuill } from '../store.js';
import { randomId, closeModals } from '../utils.js';
import { CATEGORIES } from '../config.js';

let currentAttractionId = null;

export function openAttractionModal(id = null) {
    currentAttractionId = id;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = id ? d.attractions.find(x => String(x.id) === String(id)) : null;

    document.getElementById('attTitle').innerText = a ? 'Editar Atração' : 'Nova Atração';
    document.getElementById('attName').value      = a ? a.name : '';
    document.getElementById('attSubtitle').value  = a ? (a.subtitle || '') : '';
    document.getElementById('attType').value      = a ? a.type : 'sight';
    document.getElementById('attPriority').value  = a ? (a.priority || 'standard') : 'standard';
    document.getElementById('attHours').value     = a ? (a.hours || '') : '';
    document.getElementById('attAddress').value   = a ? (a.address || '') : '';
    document.getElementById('attMapNum').value    = a ? (a.mapNumber || '') : '';
    
    // Fotos
    document.getElementById('attPhotos').value    = a ? (a.photos ? a.photos.join('\n') : (a.photo || '')) : '';

    // Quill Editor (Descrição)
    const quill = getAttractionQuill();
    if (quill) {
        quill.root.innerHTML = a ? (a.description || '') : '';
    }

    // Custos
    const list = document.getElementById('tempCostList');
    list.innerHTML = '';
    const costs = a ? [...a.costs] : [];
    costs.forEach(c => addTempCostRow(c.desc, c.value, c.currency));

    document.getElementById('attractionModal').classList.remove('hidden');
        // --- NOVO: Inicializa o Autocomplete do Google no campo de endereço ---
    if (window.google && !document.getElementById('attAddress').dataset.autocompleteBound) {
        const input = document.getElementById('attAddress');
        const autocomplete = new google.maps.places.Autocomplete(input);
        
        // Quando o usuário selecionar um lugar, podemos até capturar mais detalhes no futuro
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            console.log("Local selecionado:", place.name);
        });

        // Marca como "vinculado" para não repetir a inicialização desnecessariamente
        input.dataset.autocompleteBound = "true";
    }
}

// Função para adicionar uma nova linha de custo no HTML
export function addTempCost(desc = '', value = '', currency = 'USD', paid = false) {
    const list = document.getElementById('tempCostList');
    if (!list) return;
    
    // O 'checked' define se a caixa vem marcada ou não
    const isChecked = paid ? 'checked' : '';
    
    const html = `
        <div class="flex items-center gap-2 bg-white p-2 border rounded shadow-sm cost-item">
            <input type="text" placeholder="Ex: Bilhete" value="${desc}" class="cost-desc flex-1 p-1.5 border rounded text-xs">
            <input type="number" placeholder="0.00" value="${value}" class="cost-val w-20 p-1.5 border rounded text-xs font-mono">
            <select class="cost-cur p-1.5 border rounded bg-white text-xs">
                <option value="USD" ${currency === 'USD' ? 'selected' : ''}>$</option>
                <option value="EUR" ${currency === 'EUR' ? 'selected' : ''}>€</option>
                <option value="GBP" ${currency === 'GBP' ? 'selected' : ''}>£</option>
                <option value="BRL" ${currency === 'BRL' ? 'selected' : ''}>R$</option>
            </select>
            <div class="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border">
                <input type="checkbox" class="cost-paid w-3 h-3 cursor-pointer" ${isChecked}>
                <label class="text-[9px] uppercase font-bold text-gray-500 cursor-pointer">Pago</label>
            </div>
            <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 font-bold px-1">&times;</button>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', html);
}

// Quando abrir o modal, certifique-se de que carrega os custos com o estado correcto
// (Coloque este loop dentro da sua função openAttractionModal, na parte onde carrega os dados)
/*
    const list = document.getElementById('tempCostList');
    list.innerHTML = '';
    if (attraction.costs) {
        attraction.costs.forEach(c => addTempCost(c.desc, c.value, c.currency, c.paid));
    }
*/

// Quando for guardar a atracção (dentro da função saveAttraction), actualize a recolha dos custos:
/*
    const newCosts = [];
    document.querySelectorAll('#tempCostList .cost-item').forEach(el => {
        newCosts.push({
            desc: el.querySelector('.cost-desc').value,
            value: el.querySelector('.cost-val').value,
            currency: el.querySelector('.cost-cur').value,
            paid: el.querySelector('.cost-paid').checked // Guarda o estado da checkbox!
        });
    });
    // Depois atribua newCosts ao seu objecto da atracção antes de guardar...
*/

function addTempCostRow(d='', v='', c='BRL') {
    const div = document.createElement('div');
    div.className = 'flex gap-1 mb-2 items-center cost-row';
    div.innerHTML = `
        <input type="text"   placeholder="Item"  class="flex-1 p-1 border rounded text-xs cost-desc" value="${d}">
        <input type="number" placeholder="Valor" class="w-20 p-1 border rounded text-xs cost-val"  value="${v}">
        <select class="p-1 border rounded text-xs cost-cur">
            <option value="BRL" ${c==='BRL'?'selected':''}>R$</option>
            <option value="USD" ${c==='USD'?'selected':''}>$</option>
            <option value="EUR" ${c==='EUR'?'selected':''}>€</option>
            <option value="GBP" ${c==='GBP'?'selected':''}>£</option>
        </select>
        <button onclick="this.parentElement.remove()" class="text-red-500 px-1">×</button>
    `;
    document.getElementById('tempCostList').appendChild(div);
}

export async function saveAttraction() {
    // 1. Encontra a viagem e o dia atual
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    const d = t.days.find(x => x.id === currentState.dayId);
    if (!d) return;

    const name = document.getElementById('attName').value.trim();
    if (!name) {
        alert('Dê um nome para a atração antes de salvar!');
        return;
    }

    // 2. A MÁGICA DOS CUSTOS: Varre a tela e coleta tudo
    const newCosts = [];
    document.querySelectorAll('#tempCostList .cost-item').forEach(el => {
        const desc = el.querySelector('.cost-desc').value.trim();
        const value = el.querySelector('.cost-val').value;
        const currency = el.querySelector('.cost-cur').value;
        const paid = el.querySelector('.cost-paid').checked; // Lê se está pago ou não
        
        // Só salva se tiver um valor preenchido maior que zero
        if (value && parseFloat(value) > 0) {
            newCosts.push({ desc, value, currency, paid });
        }
    });

    // 3. Monta o objeto completo da atração
    const attId = document.getElementById('attractionModal').dataset.editingId;
    const attractionData = {
        id: attId || Math.random().toString(36).substr(2, 9),
        name: name,
        subtitle: document.getElementById('attSubtitle').value,
        type: document.getElementById('attType').value,
        priority: document.getElementById('attPriority').value,
        hours: document.getElementById('attHours').value,
        mapNum: document.getElementById('attMapNum').value,
        address: document.getElementById('attAddress').value,
        photos: document.getElementById('attPhotos').value.split('\n').filter(p => p.trim() !== ''),
        desc: window.quill ? window.quill.root.innerHTML : document.getElementById('attDescEditor').innerHTML,
        costs: newCosts, // <-- AQUI! Passamos a lista de custos para o objeto
        visited: false
    };

    // 4. Salva ou Atualiza
    if (attId) {
        const idx = d.attractions.findIndex(a => a.id === attId);
        if (idx > -1) {
            // Se já existia, mantém o status de visitado intacto
            attractionData.visited = d.attractions[idx].visited;
            d.attractions[idx] = attractionData;
        }
    } else {
        d.attractions.push(attractionData);
    }

    // 5. Salva no banco e atualiza a tela
    await saveData();
    window.closeModals();
    window.render(); 
}

// Expõe para o window apenas o necessário para os botões do modal
window.addTempCost = addTempCost;