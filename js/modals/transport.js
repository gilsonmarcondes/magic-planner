import { appData, currentState, saveData } from '../store.js';

let transMap, directionsService, directionsRenderer;

export function openTransportModal(id = null) {
    const modal = document.getElementById('transportModal');
    modal.classList.remove('hidden');

    // Limpa a interface
    document.getElementById('transType').value = 'flight';
    document.getElementById('transRef').value = '';
    document.getElementById('transOrigin').value = '';
    document.getElementById('transDest').value = '';
    document.getElementById('transDepTime').value = '';
    document.getElementById('transArrTime').value = '';
    document.getElementById('transCost').value = '';
    document.getElementById('transPaid').checked = false;
    document.getElementById('routeStepsList').innerHTML = ''; // Limpa os trechos
    
    document.getElementById('routeInfoOverlay').classList.add('hidden');
    document.getElementById('mapPlaceholder').classList.remove('hidden');

    // Inicializa o Mapa
    if (window.google && !transMap) {
        transMap = new google.maps.Map(document.getElementById('transportMap'), {
            center: { lat: 28.5383, lng: -81.3792 }, 
            zoom: 10, disableDefaultUI: true, zoomControl: true
        });
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: transMap, suppressMarkers: false,
            polylineOptions: { strokeColor: '#0c4a6e', strokeWeight: 4 }
        });

        new google.maps.places.Autocomplete(document.getElementById('transOrigin'));
        new google.maps.places.Autocomplete(document.getElementById('transDest'));
    }

    // Se estiver a editar um bilhete existente...
    if (id) {
        modal.dataset.editingId = id;
        const t = appData.trips.find(x => x.id === currentState.tripId);
        const d = t.days.find(x => x.id === currentState.dayId);
        const trans = d.transport.find(x => String(x.id) === String(id));
        
        if (trans) {
            document.getElementById('transType').value = trans.type || 'flight';
            document.getElementById('transRef').value = trans.ref || '';
            document.getElementById('transOrigin').value = trans.origin || '';
            document.getElementById('transDest').value = trans.dest || '';
            document.getElementById('transDepTime').value = trans.depTime || '';
            document.getElementById('transArrTime').value = trans.arrTime || '';
            document.getElementById('transCost').value = trans.cost || '';
            document.getElementById('transCur').value = trans.currency || 'USD';
            document.getElementById('transPaid').checked = trans.paid || false;

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

// NOVO: Adiciona uma linha de trecho no HTML
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
                    <input type="text" placeholder="Horário ou Tempo (ex: 20 min)" value="${time}" class="step-time w-24 p-1.5 border rounded text-[10px] font-mono shadow-inner">
                    <input type="text" placeholder="Ex: Linha Circle p/ Victoria" value="${desc}" class="step-desc flex-1 p-1.5 border rounded text-xs shadow-inner">
                </div>
            </div>
            <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 font-bold px-1 text-lg">&times;</button>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', html);
}

// A MÁGICA DA ROTA (Mapa)
export function calcTransportRoute() {
    if (!directionsService) return;
    const origin = document.getElementById('transOrigin').value;
    const dest = document.getElementById('transDest').value;
    const type = document.getElementById('transType').value;

    if (!origin || !dest) return alert("Preencha a origem e o destino para calcular a rota!");

    let travelMode = google.maps.TravelMode.DRIVING;
    if (type === 'train') travelMode = google.maps.TravelMode.TRANSIT;
    if (type === 'flight') {
        alert("Voos são directos! O mapa marcará os aeroportos sem rota terrestre.");
        directionsRenderer.setDirections({routes: []}); 
        return;
    }

    document.getElementById('mapPlaceholder').classList.add('hidden');
    directionsService.route({ origin: origin, destination: dest, travelMode: travelMode }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
            const route = response.routes[0].legs[0];
            document.getElementById('routeDistance').innerText = route.distance.text;
            document.getElementById('routeDuration').innerText = route.duration.text;
            document.getElementById('routeInfoOverlay').classList.remove('hidden');
        } else {
            alert("Não foi possível traçar uma rota por terra/mar entre estes locais.");
        }
    });
}

// GUARDA O BILHETE E OS TRECHOS
export async function saveTransport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    const d = t.days.find(x => x.id === currentState.dayId);
    if (!d) return;

    // NOVO: Lê todos os trechos da tela
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
        type: document.getElementById('transType').value,
        ref: document.getElementById('transRef').value.toUpperCase(),
        origin: document.getElementById('transOrigin').value,
        dest: document.getElementById('transDest').value,
        depTime: document.getElementById('transDepTime').value,
        arrTime: document.getElementById('transArrTime').value,
        cost: document.getElementById('transCost').value,
        currency: document.getElementById('transCur').value,
        paid: document.getElementById('transPaid').checked,
        steps: newSteps // <- Trechos guardados aqui!
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
    window.render();
}

// Expõe para o HTML
window.openTransportModal = openTransportModal;
window.calcTransportRoute = calcTransportRoute;
window.saveTransport = saveTransport;
window.addRouteStep = addRouteStep;