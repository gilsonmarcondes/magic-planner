// --- MODAL: HOTEL ---
import { appData, currentState, saveData, setCurrentEditingHotelId, currentEditingHotelId } from '../store.js';
import { formatDateBr, randomId } from '../utils.js';


export function openHotelManager() {
    setCurrentEditingHotelId(null);
    const modal = document.getElementById('hotelModal');
    if (!modal) return alert('Modal de Hotel não encontrado.');

    ['hotelName','hotelAddress','hotelCheckIn','hotelCheckOut','hotelCost','hotelPayDate'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const chkPaid = document.getElementById('hotelPaid'); if (chkPaid) chkPaid.checked = false;
    toggleHotelPayDate();

    const btnSave   = document.getElementById('btnSaveHotel');   if (btnSave)   btnSave.innerText = 'Salvar Hotel';
    const btnCancel = document.getElementById('btnCancelEditHotel'); if (btnCancel) btnCancel.classList.add('hidden');

    modal.classList.add('active');
    renderHotelList();
}

export function saveHotel() {
    const name     = document.getElementById('hotelName').value;
    const checkIn  = document.getElementById('hotelCheckIn').value;
    const checkOut = document.getElementById('hotelCheckOut').value;
    if (!name || !checkIn || !checkOut) return alert('Preencha Nome, Check-in e Check-out.');

    const t    = appData.trips.find(x => x.id === currentState.tripId);
    const data = {
        id:       currentEditingHotelId || randomId(),
        name,
        address:  document.getElementById('hotelAddress').value,
        checkIn, checkOut,
        cost:     document.getElementById('hotelCost').value,
        currency: document.getElementById('hotelCurr').value,
        paid:     document.getElementById('hotelPaid').checked,
        payDate:  document.getElementById('hotelPayDate').value,
    };

    if (currentEditingHotelId) {
        const idx = t.hotels.findIndex(h => h.id === currentEditingHotelId);
        if (idx !== -1) t.hotels[idx] = data;
    } else { t.hotels.push(data); }

    saveData(); openHotelManager(); window.render();
}

export function editHotel(id) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const h = t.hotels.find(x => x.id === id); if (!h) return;
    setCurrentEditingHotelId(id);

    document.getElementById('hotelName').value     = h.name;
    document.getElementById('hotelAddress').value  = h.address;
    document.getElementById('hotelCheckIn').value  = h.checkIn;
    document.getElementById('hotelCheckOut').value = h.checkOut;
    document.getElementById('hotelCost').value     = h.cost;
    document.getElementById('hotelCurr').value     = h.currency;
    document.getElementById('hotelPaid').checked   = h.paid;
    document.getElementById('hotelPayDate').value  = h.payDate || '';
    toggleHotelPayDate();

    document.getElementById('btnSaveHotel').innerText = 'Atualizar';
    document.getElementById('btnCancelEditHotel').classList.remove('hidden');
}

export function deleteHotel(id) {
    if (!confirm('Remover este hotel?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.hotels = t.hotels.filter(h => h.id !== id);
    saveData(); renderHotelList(); render();
}

export function cancelEditHotel() { openHotelManager(); }

export function toggleHotelPayDate() {
    const chk       = document.getElementById('hotelPaid');
    const container = document.getElementById('hotelPayDateContainer');
    if (chk && container) container.classList.toggle('hidden', !chk.checked);
}

function renderHotelList() {
    const t    = appData.trips.find(x => x.id === currentState.tripId);
    const list = document.getElementById('hotelList'); if (!list) return;
    list.innerHTML = t.hotels.map(h => `
        <div class="p-3 mb-2 bg-gray-50 border border-gray-200 rounded flex justify-between items-center">
            <div>
                <strong class="text-sm text-[#0c4a6e] block">${h.name}</strong>
                <span class="text-xs text-gray-500">${formatDateBr(h.checkIn)} ➝ ${formatDateBr(h.checkOut)}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="window.editHotel('${h.id}')"   class="text-blue-500 hover:bg-blue-100 p-1 rounded">✏️</button>
                <button onclick="window.deleteHotel('${h.id}')" class="text-red-500 hover:bg-red-100 p-1 rounded">×</button>
            </div>
        </div>`).join('');
}
