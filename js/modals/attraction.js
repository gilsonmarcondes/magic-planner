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

export function addTempCost() {
    addTempCostRow('', '', 'BRL');
}

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
    const name = document.getElementById('attName').value;
    if (!name) return alert('Nome é obrigatório');

    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    
    const quill = getAttractionQuill();
    const desc = quill ? quill.root.innerHTML : '';
    
    const costs = Array.from(document.querySelectorAll('.cost-row')).map(row => ({
        desc: row.querySelector('.cost-desc').value,
        value: row.querySelector('.cost-val').value,
        currency: row.querySelector('.cost-cur').value
    }));

    const photosRaw = document.getElementById('attPhotos').value.trim();
    const photos = photosRaw ? photosRaw.split('\n').map(url => url.trim()) : [];

    const attData = {
        id: currentAttractionId || randomId(),
        name,
        subtitle: document.getElementById('attSubtitle').value,
        type: document.getElementById('attType').value,
        priority: document.getElementById('attPriority').value,
        hours: document.getElementById('attHours').value,
        address: document.getElementById('attAddress').value,
        mapNumber: document.getElementById('attMapNum').value,
        description: desc,
        costs,
        photos,
        visited: false
    };

    if (currentAttractionId) {
        const idx = d.attractions.findIndex(x => String(x.id) === String(currentAttractionId));
        attData.visited = d.attractions[idx].visited;
        d.attractions[idx] = attData;
    } else {
        d.attractions.push(attData);
    }

    await saveData(); // Agora o saveData é assíncrono (nuvem)
    closeModals();
    window.render();
}

// Expõe para o window apenas o necessário para os botões do modal
window.addTempCost = addTempCost;