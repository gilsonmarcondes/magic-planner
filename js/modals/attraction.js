import { appData, currentState, saveData, getAttractionQuill } from '../store.js';
import { randomId, closeModals } from '../utils.js';
import { CATEGORIES } from '../config.js';

let currentAttractionId = null;

// 1. ABRIR E CARREGAR DADOS
export function openAttractionModal(id = null) {
    currentAttractionId = id;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = id ? d.attractions.find(x => String(x.id) === String(id)) : null;

    const modal = document.getElementById('attractionModal');
    
    // CORREÇÃO CRÍTICA 1: Diz ao modal se estamos editando ou criando
    if (id) {
        modal.dataset.editingId = id;
    } else {
        delete modal.dataset.editingId;
    }

    document.getElementById('attTitle').innerText = a ? 'Editar Atração' : 'Nova Atração';
    document.getElementById('attName').value      = a ? a.name : '';
    document.getElementById('attSubtitle').value  = a ? (a.subtitle || '') : '';
    document.getElementById('attType').value      = a ? a.type : 'sight';
    document.getElementById('attPriority').value  = a ? (a.priority || 'standard') : 'standard';
    document.getElementById('attHours').value     = a ? (a.hours || '') : '';
    document.getElementById('attAddress').value   = a ? (a.address || '') : '';
    document.getElementById('attMapNum').value    = a ? (a.mapNum || '') : ''; 
    
    // Fotos
    document.getElementById('attPhotos').value    = a ? (a.photos ? a.photos.join('\n') : (a.photo || '')) : '';

    // Quill Editor (Descrição)
    const quill = getAttractionQuill();
    if (quill) {
        quill.root.innerHTML = a ? (a.description || a.desc || '') : '';
    } else {
        document.getElementById('attDescEditor').innerHTML = a ? (a.description || a.desc || '') : '';
    }

    // CORREÇÃO CRÍTICA 2: Carrega os custos usando a função NOVA (com checkbox)
    const list = document.getElementById('tempCostList');
    list.innerHTML = '';
    const costs = a && a.costs ? [...a.costs] : [];
    costs.forEach(c => addTempCost(c.desc, c.value, c.currency, c.paid));

    modal.classList.remove('hidden');

    // Inicializa o Autocomplete do Google no campo de endereço
    if (window.google && !document.getElementById('attAddress').dataset.autocompleteBound) {
        const input = document.getElementById('attAddress');
        const autocomplete = new google.maps.places.Autocomplete(input);
        
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if(place.formatted_address) input.value = place.formatted_address;
        });
        input.dataset.autocompleteBound = "true";
    }
}

// 2. CRIAR LINHAS DE CUSTO (A ÚNICA FUNÇÃO DE CUSTO AGORA)
export function addTempCost(desc = '', value = '', currency = 'USD', paid = false) {
    const list = document.getElementById('tempCostList');
    if (!list) return;
    
    const isChecked = paid ? 'checked' : '';
    
    const html = `
        <div class="flex items-center gap-2 bg-white p-2 border rounded shadow-sm cost-item mb-2">
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
            <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 font-bold px-1 text-lg">&times;</button>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', html);
}

// 3. SALVAR TUDO NO BANCO DE DADOS
export async function saveAttraction() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    const d = t.days.find(x => x.id === currentState.dayId);
    if (!d) return;

    const name = document.getElementById('attName').value.trim();
    if (!name) {
        alert('Dê um nome para a atração antes de salvar!');
        return;
    }

    // A MÁGICA DOS CUSTOS: Varre a tela e coleta tudo
    const newCosts = [];
    document.querySelectorAll('#tempCostList .cost-item').forEach(el => {
        const desc = el.querySelector('.cost-desc').value.trim();
        const value = el.querySelector('.cost-val').value;
        const currency = el.querySelector('.cost-cur').value;
        const paid = el.querySelector('.cost-paid').checked; 
        
        if (value && parseFloat(value) > 0) {
            newCosts.push({ desc, value, currency, paid });
        }
    });

    const modal = document.getElementById('attractionModal');
    const attId = modal.dataset.editingId;

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
        costs: newCosts, 
        visited: false
    };

    // Salva ou Atualiza
    if (attId) {
        const idx = d.attractions.findIndex(a => a.id === attId);
        if (idx > -1) {
            attractionData.visited = d.attractions[idx].visited;
            d.attractions[idx] = attractionData;
        }
    } else {
        d.attractions.push(attractionData);
    }

    await saveData();
    window.closeModals();
    window.render(); 
}

// Expõe para o window apenas o necessário para os botões do modal
window.addTempCost = addTempCost;