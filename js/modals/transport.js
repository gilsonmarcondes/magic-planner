import { appData, currentState, saveData } from '../store.js';

let transMap, directionsService, directionsRenderer;

export function openTransportModal(id = null) {
    const modal = document.getElementById('transportModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    // Função super segura: se o campo não existir, ele ignora e não trava o app!
    const safeSet = (elementId, value) => {
        const el = document.getElementById(elementId);
        if (el) el.value = value;
    };

    // Limpa a interface
    safeSet('transType', 'flight');
    safeSet('transRef', '');
    safeSet('transOrigin', '');
    safeSet('transDest', '');
    safeSet('transDepTime', '');
    safeSet('transArrTime', '');
    safeSet('transCost', '');
    
    const paidCheckbox = document.getElementById('transPaid');
    if (paidCheckbox) paidCheckbox.checked = false;
    
    const stepsList = document.getElementById('routeStepsList');
    if (stepsList) stepsList.innerHTML = ''; 
    
    const overlay = document.getElementById('routeInfoOverlay');
    if (overlay) overlay.classList.add('hidden');
    
    const mapPlaceholder = document.getElementById('mapPlaceholder');
    if (mapPlaceholder) mapPlaceholder.classList.remove('hidden');

    // Inicializa o Mapa (com proteção dupla)
    if (window.google && !transMap && document.getElementById('transportMap')) {
        transMap = new google.maps.Map(document.getElementById('transportMap'), {
            center: { lat: 28.5383, lng: -81.3792 }, // Orlando!
            zoom: 10, disableDefaultUI: true, zoomControl: true
        });
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: transMap, suppressMarkers: false,
            polylineOptions: { strokeColor: '#0c4a6e', strokeWeight: 4 }
        });

        if (document.getElementById('transOrigin')) new google.maps.places.Autocomplete(document.getElementById('transOrigin'));
        if (document.getElementById('transDest')) new google.maps.places.Autocomplete(document.getElementById('transDest'));
    }

    // Se estiver a editar um bilhete existente...
    if (id) {
        modal.dataset.editingId = id;
        const t = appData.trips.find(x => x.id === currentState.tripId);
        if (!t) return;
        const d = t.days.find(x => x.id === currentState.dayId);
        if (!d || !d.transport) return;
        
        const trans = d.transport.find(x => String(x.id) === String(id));
        
        if (trans) {
            safeSet('transType', trans.type || 'flight');
            safeSet('transRef', trans.ref || '');
            safeSet('transOrigin', trans.origin || '');
            safeSet('transDest', trans.dest || '');
            safeSet('transDepTime', trans.depTime || '');
            safeSet('transArrTime', trans.arrTime || '');
            safeSet('transCost', trans.cost || '');
            safeSet('transCur', trans.currency || 'USD');
            if (paidCheckbox) paidCheckbox.checked = trans.paid || false;

            // Carrega os trechos (passo a passo) gravados!
            if (trans.steps && trans.steps.length > 0) {
                trans.steps.forEach(s => addRouteStep(s.mode, s.time, s.desc));
            }

            if (trans.origin && trans.dest) calcTransportRoute();
        }
    } else {
        delete modal.dataset.editingId;
    }
}

// ADICIONA UM TRECHO DE ROTA
export function addRouteStep(mode = 'walk', time = '', desc = '') {
    const list = document.getElementById('routeStepsList');
    if (!list) return;

    const html = `
        <div class="flex items-start gap-2 bg-white p-2 border border-slate-200 rounded shadow-sm step-item">
            <select class="step-mode p-1.5 border rounded bg-gray-50 text-xs font-bold w-[50px] text-center cursor-pointer shadow-sm">
                <option value="walk" ${mode === 'walk' ? 'selected' : ''}>🚶</option>
                <option value="tube" ${mode === 'tube' ? 'selected' : ''}>🚇</option>
                <option value="train" ${mode === 'train' ? 'selected' : ''}>🚆</option>
                <option value="bus" ${mode === 'bus' ? 'selected' : ''}>🚌</option>
                <option value="car" ${mode === 'car' ? 'selected' : ''}>🚗</option>
                <option value="flight" ${mode === 'flight' ? 'selected' : ''}>✈️</option>
            </select>
            <div class="flex-1 flex flex-col gap-1">
                <div class="flex gap-1">
                    <input type="text" placeholder="Horário ou Tempo" value="${time}" class="step-time w-24 p-1.5 border rounded text-[10px] font-mono shadow-inner">
                    <input type="text" placeholder="Ex: Linha Circle" value="${desc}" class="step-desc flex-1 p-1.5 border rounded text-xs shadow-inner">
                </div>
            </div>
            <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 font-bold px-1 text-lg">&times;</button>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', html);
}

// A MÁGICA DO MAPA
export function calcTransportRoute() {
    if (!directionsService) return;
    const origin = document.getElementById('transOrigin')?.value;
    const dest = document.getElementById('transDest')?.value;
    const type = document.getElementById('transType')?.value;

    if (!origin || !dest) return alert("Preencha a origem e o destino para calcular a rota!");

    let travelMode = google.maps.TravelMode.DRIVING;
    if (type === 'train') travelMode = google.maps.TravelMode.TRANSIT;
    if (type === 'flight') {
        alert("Voos são diretos! O mapa marcará os aeroportos sem rota terrestre.");
        directionsRenderer.setDirections({routes: []}); 
        return;
    }

    const mapPlaceholder = document.getElementById('mapPlaceholder');
    if (mapPlaceholder) mapPlaceholder.classList.add('hidden');
    
    directionsService.route({ origin: origin, destination: dest, travelMode: travelMode }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
            const route = response.routes[0].legs[0];
            
            const distEl = document.getElementById('routeDistance');
            const durEl = document.getElementById('routeDuration');
            const overlay = document.getElementById('routeInfoOverlay');
            
            if (distEl) distEl.innerText = route.distance.text;
            if (durEl) durEl.innerText = route.duration.text;
            if (overlay) overlay.classList.remove('hidden');
        } else {
            alert("Não foi possível traçar uma rota por terra/mar entre estes locais.");
        }
    });
}

// GUARDAR BILHETE E TRECHOS
export async function saveTransport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    const d = t.days.find(x => x.id === currentState.dayId);
    if (!d) return;

    // Lê todos os trechos da tela
    const newSteps = [];
    document.querySelectorAll('#routeStepsList .step-item').forEach(el => {
        const mode = el.querySelector('.step-mode').value;
        const time = el.querySelector('.step-time').value.trim();
        const desc = el.querySelector('.step-desc').value.trim();
        if (time || desc) newSteps.push({ mode, time, desc });
    });

    const modal = document.getElementById('transportModal');
    const transId = modal.dataset.editingId;

    const newTrans = {
        id: transId || Math.random().toString(36).substr(2, 9),
        type: document.getElementById('transType')?.value || 'flight',
        ref: document.getElementById('transRef')?.value.toUpperCase() || '',
        origin: document.getElementById('transOrigin')?.value || '',
        dest: document.getElementById('transDest')?.value || '',
        depTime: document.getElementById('transDepTime')?.value || '',
        arrTime: document.getElementById('transArrTime')?.value || '',
        cost: document.getElementById('transCost')?.value || '',
        currency: document.getElementById('transCur')?.value || 'USD',
        paid: document.getElementById('transPaid')?.checked || false,
        steps: newSteps // Guarda o passo a passo!
    };

    if (!d.transport) d.transport = [];
    if (transId) {
        const idx = d.transport.findIndex(x => String(x.id) === String(transId));
        if (idx > -1) d.transport[idx] = newTrans;
    } else {
        d.transport.push(newTrans);
    }

    await saveData();
    window.closeModals();