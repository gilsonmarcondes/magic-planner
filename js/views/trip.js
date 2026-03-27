import { appData, saveData } from '../store.js';
import { render, goTo } from '../router.js';
import { closeModals } from '../utils.js';

let editingTripId = null;

export function openTripModal(id = null) {
    editingTripId = id;
    const modal = document.getElementById('tripModal');
    const t = id ? appData.trips.find(x => x.id === id) : null;

    document.getElementById('tripModalTitle').innerText = t ? 'Editar Viagem' : 'Nova Viagem';
    document.getElementById('tripName').value = t ? t.name : '';
    document.getElementById('tripStart').value = t ? t.startDate : '';
    document.getElementById('tripEnd').value = t ? t.endDate : '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export async function saveTrip() {
    const name = document.getElementById('tripName').value.trim();
    const start = document.getElementById('tripStart').value;
    const end = document.getElementById('tripEnd').value;

    if (!name || !start || !end) return alert('Preencha todos os campos!');

    const tripData = editingTripId 
        ? appData.trips.find(x => x.id === editingTripId)
        : { id: Math.random().toString(36).substr(2, 9), days: [], hotels: [], initialCosts: [], checklist: [], rates: {USD:0, EUR:0, GBP:0} };

    tripData.name = name;
    tripData.startDate = start;
    tripData.endDate = end;

    if (!editingTripId) {
        let current = new Date(start + 'T00:00:00');
        const last = new Date(end + 'T00:00:00');
        while (current <= last) {
            tripData.days.push({
                id: Math.random().toString(36).substr(2, 9),
                date: current.toISOString().split('T')[0],
                locations: [], attractions: [], transport: [], extraCosts: []
            });
            current.setDate(current.getDate() + 1);
        }
        appData.trips.push(tripData);
    }

    await saveData();
    closeModals();
    render();
}