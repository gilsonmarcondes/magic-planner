// --- MODAL: TRANSPORT ---
import { appData, currentState, saveData } from '../store.js';
import { randomId, closeModals } from '../utils.js';

let currentEditingId = null; // Usamos uma variável local aqui para simplificar

export function openTransportModal(id = null) {
    currentEditingId = id;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const tr = id ? d.transport.find(x => String(x.id) === String(id)) : null;

    document.getElementById('transTitle').innerText = tr ? 'Editar Bilhete' : 'Novo Bilhete';
    document.getElementById('transName').value  = tr ? tr.title : '';
    document.getElementById('transCost').value  = tr ? tr.cost : '';
    document.getElementById('transCur').value   = tr ? tr.currency : 'BRL';
    document.getElementById('transMap').value   = tr ? (tr.mapUrl || '') : '';

    const list = document.getElementById('routeStepsList');
    list.innerHTML = '';
    const steps = tr ? [...tr.steps] : [{ icon: '📍', time: '', location: '', arrivalLoc: '' }];
    steps.forEach((s, i) => addRouteStepRow(s.icon, s.time, s.location, s.arrivalLoc));

    document.getElementById('transportModal').classList.remove('hidden');
}

function addRouteStepRow(i='📍', t='', l='', a='') {
    const div = document.createElement('div');
    div.className = 'flex gap-1 mb-2 items-center step-row';
    div.innerHTML = `
        <input type="text" placeholder="🕒" class="w-12 p-1 border rounded text-xs step-time" value="${t}">
        <input type="text" placeholder="De..." class="flex-1 p-1 border rounded text-xs step-loc" value="${l}">
        <span class="text-gray-400">➔</span>
        <input type="text" placeholder="Para.." class="flex-1 p-1 border rounded text-xs step-arr" value="${a}">
        <button onclick="this.parentElement.remove()" class="text-red-500 px-1">×</button>
    `;
    document.getElementById('routeStepsList').appendChild(div);
}

export function addRouteStep() {
    addRouteStepRow();
}

export async function saveRoute() {
    const title = document.getElementById('transName').value;
    if (!title) return alert('Título obrigatório');

    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);

    const steps = Array.from(document.querySelectorAll('.step-row')).map(row => ({
        icon: '📍',
        time: row.querySelector('.step-time').value,
        location: row.querySelector('.step-loc').value,
        arrivalLoc: row.querySelector('.step-arr').value
    }));

    const transData = {
        id: currentEditingId || randomId(),
        title,
        cost: document.getElementById('transCost').value || 0,
        currency: document.getElementById('transCur').value,
        mapUrl: document.getElementById('transMap').value,
        steps
    };

    if (currentEditingId) {
        const idx = d.transport.findIndex(x => String(x.id) === String(currentEditingId));
        d.transport[idx] = transData;
    } else {
        d.transport.push(transData);
    }

    await saveData(); // Salva na nuvem
    closeModals();
    window.render();
}

export function deleteTransport(id) {
    if (!confirm('Deletar bilhete?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.transport = d.transport.filter(x => String(x.id) !== String(id));
    saveData();
    window.render();
}

// Expõe funções para os botões do HTML
window.addRouteStep = addRouteStep;