// --- LÓGICA DO MODAL DE VIAGEM (ADICIONADA AQUI) ---
let editingTripId = null;

export function openTripModal(id = null) {
    editingTripId = id;
    const modal = document.getElementById('tripModal');
    if (!modal) return alert("Erro: Modal de viagem não encontrado no index.html");
    
    // Import dinâmico para evitar dependências circulares, se necessário, ou usar appData direto
    import('../store.js').then(({ appData }) => {
        const t = id ? appData.trips.find(x => x.id === id) : null;

        document.getElementById('tripModalTitle').innerText = t ? 'Editar Viagem' : 'Nova Viagem';
        document.getElementById('tripName').value = t ? t.name : '';
        document.getElementById('tripStart').value = t ? t.startDate : '';
        document.getElementById('tripEnd').value = t ? t.endDate : '';

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });
}

export async function saveTrip() {
    const name = document.getElementById('tripName').value.trim();
    const start = document.getElementById('tripStart').value;
    const end = document.getElementById('tripEnd').value;

    if (!name || !start || !end) {
        alert('✨ Por favor, preencha todos os campos!');
        return;
    }

    import('../store.js').then(async ({ appData, saveData }) => {
        let tripData;

        if (editingTripId) {
            tripData = appData.trips.find(x => x.id === editingTripId);
            tripData.name = name;
            tripData.startDate = start;
            tripData.endDate = end;
        } else {
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
        import('../utils.js').then(({ closeModals }) => closeModals());
        import('../router.js').then(({ render }) => render());
    });
}

// --- Funções de Gestão de Dias (Necessárias para o main.js não travar) ---

export async function addDay() {
    console.log("Função Adicionar Dia");
    // A lógica de adicionar dias será colocada aqui futuramente
}

export async function addBucketList() {
    console.log("Função Adicionar Bucket List");
    // A lógica do Bucket List será colocada aqui futuramente
}

export async function deleteDay(dayId) {
    console.log("Função Deletar Dia: ", dayId);
    // A lógica de deletar dias será colocada aqui futuramente
}