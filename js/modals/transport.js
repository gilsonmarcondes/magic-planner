// --- MODAL: TRANSPORTE ---
import { appData, currentState, tempRouteSteps, saveData,
         setTempRouteSteps, setCurrentEditingTicketId, currentEditingTicketId } from '../store.js';
import { calculateEndTime, closeModals, randomId } from '../utils.js';
import { render } from '../router.js';

const TRANSPORT_ICONS = { walk:'🚶', train:'🚆', bus:'🚌', car:'🚗', subway:'🚇', plane:'✈️' };

export function openTransportModal(ticketId = null) {
    setTempRouteSteps([]);
    setCurrentEditingTicketId(ticketId);

    const modal = document.getElementById('transportModal');
    if (!modal) return console.error('Modal de transporte não encontrado.');

    const titleEl = document.getElementById('transportModalTitle');
    const btnEl   = document.getElementById('btnSaveRoute');
    const titleIn = document.getElementById('routeTitle');
    const costIn  = document.getElementById('routeCost');
    const currIn  = document.getElementById('routeCurr');
    const mapIn   = document.getElementById('routeMap'); // <--- CAMPO DO MAPA

    if (ticketId) {
        const t      = appData.trips.find(x => x.id === currentState.tripId);
        const d      = t.days.find(x => x.id === currentState.dayId);
        const ticket = d.transport.find(x => x.id === ticketId);
        if (titleIn) titleIn.value = ticket.title;
        if (costIn)  costIn.value  = ticket.cost;
        if (currIn)  currIn.value  = ticket.currency;
        if (mapIn)   mapIn.value   = ticket.mapUrl || ''; // <--- CARREGA O MAPA
        
        setTempRouteSteps(JSON.parse(JSON.stringify(ticket.steps || [])));
        if (btnEl)   btnEl.innerText   = 'Salvar Alterações';
        if (titleEl) titleEl.innerText = 'Editar Bilhete';
    } else {
        if (titleIn) titleIn.value = '';
        if (costIn)  costIn.value  = '';
        if (mapIn)   mapIn.value   = ''; // <--- LIMPA O MAPA PARA UM NOVO
        
        if (btnEl)   btnEl.innerText   = 'Emitir Bilhete';
        if (titleEl) titleEl.innerText = 'Novo Deslocamento';
    }

    modal.classList.add('active');
    renderRouteSteps();
}

export function addRouteStep(type) {
    tempRouteSteps.push({ id: randomId(), type, icon: TRANSPORT_ICONS[type] || '🚀', time: '', endTime: '', location: '', arrivalLoc: '', duration: '', details: '' });
    renderRouteSteps();
}

export function removeRouteStep(index) { tempRouteSteps.splice(index, 1); renderRouteSteps(); }

export function handleRouteStepChange(index, field, value) {
    tempRouteSteps[index][field] = value;
    if (field === 'time' || field === 'duration') {
        const calc = calculateEndTime(tempRouteSteps[index].time, tempRouteSteps[index].duration);
        if (calc) {
            tempRouteSteps[index].endTime = calc;
            const el = document.getElementById(`step-end-${index}`);
            if (el) el.value = calc;
        }
    }
}

function renderRouteSteps() {
    const container = document.getElementById('routeStepsContainer'); if (!container) return;
    container.innerHTML = tempRouteSteps.map((s, i) => `
        <div class="route-timeline ${s.type} relative ml-2 pl-4 border-l-2 border-dashed border-gray-300 pb-4 last:border-0">
            <div class="absolute -left-[9px] top-0 bg-white border border-gray-400 rounded-full w-4 h-4 text-[10px] flex items-center justify-center">●</div>
            <div class="bg-gray-50 p-2 rounded border border-gray-200 text-sm">
                <div class="flex justify-between items-center mb-2 border-b pb-1">
                    <span class="font-bold uppercase flex items-center gap-2 text-xs text-gray-600">${s.icon} ${s.type}</span>
                    <button onclick="window.removeRouteStep(${i})" class="text-red-400 font-bold hover:text-red-600 px-2">×</button>
                </div>
                <div class="grid grid-cols-3 gap-2 mb-2">
                    <div>
                        <label class="text-[9px] font-bold text-gray-400 uppercase">Saída</label>
                        <input type="time" value="${s.time}" onchange="window.handleRouteStepChange(${i},'time',this.value)" class="w-full p-1 border rounded text-xs">
                    </div>
                    <div>
                        <label class="text-[9px] font-bold text-gray-400 uppercase">Duração</label>
                        <input value="${s.duration}" onchange="window.handleRouteStepChange(${i},'duration',this.value)" class="w-full p-1 border rounded text-xs text-center" placeholder="Ex: 2h">
                    </div>
                    <div>
                        <label class="text-[9px] font-bold text-gray-400 uppercase">Chegada</label>
                        <input id="step-end-${i}" type="time" value="${s.endTime}" onchange="window.handleRouteStepChange(${i},'endTime',this.value)" class="w-full p-1 border rounded text-xs bg-gray-100">
                    </div>
                </div>
                <div class="space-y-1">
                    <input placeholder="De onde?" value="${s.location}"   onchange="window.handleRouteStepChange(${i},'location',this.value)"   class="w-full p-1 border rounded text-xs bg-white">
                    <input placeholder="Para onde?" value="${s.arrivalLoc}" onchange="window.handleRouteStepChange(${i},'arrivalLoc',this.value)" class="w-full p-1 border rounded text-xs bg-white">
                    <input placeholder="Detalhes (Voo, Plataforma...)" value="${s.details || ''}" onchange="window.handleRouteStepChange(${i},'details',this.value)" class="w-full p-1 border-b border-gray-200 bg-transparent text-xs text-gray-500 italic outline-none">
                </div>
            </div>
        </div>`).join('');
}

export function saveRoute() {
    const titleIn = document.getElementById('routeTitle');
    if (!titleIn.value) return alert('Dê um título para este bilhete.');

    const mapInput = document.getElementById('routeMap'); // Pega o campo do mapa

    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    
    // Agora salvamos o mapUrl junto com os outros dados
    const data = { 
        id: currentEditingTicketId || randomId(), 
        title: titleIn.value, 
        cost: document.getElementById('routeCost').value, 
        currency: document.getElementById('routeCurr').value, 
        mapUrl: mapInput ? mapInput.value : '', // <--- SALVA O MAPA
        steps: tempRouteSteps 
    };

    if (currentEditingTicketId) {
        const idx = d.transport.findIndex(tr => tr.id === currentEditingTicketId);
        if (idx !== -1) d.transport[idx] = data;
    } else { 
        d.transport.push(data); 
    }

    saveData(); 
    closeModals(); 
    render();
}

export function deleteTransport(id) {
    if (!confirm('Tem certeza que deseja apagar este bilhete?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    d.transport = d.transport.filter(tr => tr.id !== id);
    saveData(); 
    render();
}