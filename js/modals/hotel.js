// --- MODAL: HOTEL ---
import { appData, currentState, saveData } from '../store.js';
import { randomId, closeModals } from '../utils.js';

let currentEditingId = null;

export function openHotelManager(id = null) {
    currentEditingId = id;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return alert('Selecione uma viagem primeiro.');

    const h = id ? t.hotels.find(x => String(x.id) === String(id)) : null;

    // Preenche os campos do formulário
    document.getElementById('hotelName').value     = h ? h.name : '';
    document.getElementById('hotelCheckIn').value  = h ? h.checkIn : '';
    document.getElementById('hotelCheckOut').value = h ? h.checkOut : '';
    document.getElementById('hotelCost').value     = h ? h.cost : '';
    document.getElementById('hotelCur').value      = h ? h.currency : 'BRL';
    document.getElementById('hotelPayDate').value  = h ? (h.payDate || '') : '';
    document.getElementById('hotelPaid').checked   = h ? h.paid : false;

    renderHotelList(t);
    document.getElementById('hotelModal').classList.remove('hidden');
}

function renderHotelList(t) {
    const list = document.getElementById('hotelList');
    if (!list) return;

    list.innerHTML = (t.hotels || []).map(h => `
        <div class="p-2 border-b text-xs flex justify-between items-center ${h.paid ? 'bg-green-50' : ''}">
            <div class="flex flex-col">
                <span class="font-bold text-[#0c4a6e]">${h.name}</span>
                <span class="text-[10px] text-gray-500">${h.checkIn} até ${h.checkOut}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="window.editHotel('${h.id}')" class="bg-blue-100 text-blue-600 p-1 rounded hover:bg-blue-200 transition">✏️</button>
                <button onclick="window.deleteHotel('${h.id}')" class="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200 transition">🗑️</button>
            </div>
        </div>`).join('');
}

export async function saveHotel() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const name = document.getElementById('hotelName').value;
    
    if (!name) return alert('O nome do hotel é obrigatório.');

    const hData = {
        id: currentEditingId || randomId(),
        name,
        checkIn: document.getElementById('hotelCheckIn').value,
        checkOut: document.getElementById('hotelCheckOut').value,
        cost: document.getElementById('hotelCost').value || 0,
        currency: document.getElementById('hotelCur').value,
        payDate: document.getElementById('hotelPayDate').value,
        paid: document.getElementById('hotelPaid').checked
    };

    if (!t.hotels) t.hotels = [];

    if (currentEditingId) {
        const idx = t.hotels.findIndex(x => String(x.id) === String(currentEditingId));
        t.hotels[idx] = hData;
    } else {
        t.hotels.push(hData);
    }

    await saveData(); // Salva na nuvem
    currentEditingId = null;
    openHotelManager(); // Atualiza a lista no modal
    window.render();    // Atualiza a tela de fundo
}

// ESTA FUNÇÃO PRECISA DO EXPORT:
export function editHotel(id) { 
    openHotelManager(id); 
}

// ESTA FUNÇÃO PRECISA DO EXPORT:
export async function deleteHotel(id) {
    if (!confirm('Tem certeza que deseja excluir este hotel?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.hotels = t.hotels.filter(x => String(x.id) !== String(id));
    await saveData();
    openHotelManager();
    window.render();
}