import { appData, saveData } from '../store.js';
import { render } from '../router.js';
import { closeModals } from '../utils.js';

let editingTripId = null;

// 1. Abre o modal de viagem (Novo ou Edição)
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

// 2. Salva a viagem e gera os dias automaticamente
export async function saveTrip() {
    const name = document.getElementById('tripName').value.trim();
    const start = document.getElementById('tripStart').value;
    const end = document.getElementById('tripEnd').value;

    if (!name || !start || !end) {
        alert('✨ Por favor, preencha todos os campos para gerar seu roteiro mágico!');
        return;
    }

    let tripData;

    if (editingTripId) {
        // Atualiza viagem existente
        tripData = appData.trips.find(x => x.id === editingTripId);
        tripData.name = name;
        tripData.startDate = start;
        tripData.endDate = end;
    } else {
        // Cria nova viagem
        tripData = {
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            startDate: start,
            endDate: end,
            days: [],
            hotels: [],
            initialCosts: [],
            checklist: [],
            rates: { USD: 0, EUR: 0, GBP: 0 }
        };

        // Lógica de gerar os dias do roteiro com base na data inicial e final
        let current = new Date(start + 'T00:00:00');
        const last = new Date(end + 'T00:00:00');

        while (current <= last) {
            tripData.days.push({
                id: Math.random().toString(36).substr(2, 9),
                date: current.toISOString().split('T')[0],
                locations: [],
                attractions: [],
                transport: [],
                extraCosts: [],
                journal: '',
                subtitle: '',
                isBucket: false
            });
            current.setDate(current.getDate() + 1);
        }
        
        appData.trips.push(tripData);
    }

    await saveData();
    closeModals();
    render();
}