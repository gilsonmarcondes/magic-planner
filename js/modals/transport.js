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
    
    document.getElementById('routeInfoOverlay').classList.add('hidden');
    document.getElementById('mapPlaceholder').classList.remove('hidden');

    // Inicializa o Mapa se ainda não existir
    if (window.google && !transMap) {
        transMap = new google.maps.Map(document.getElementById('transportMap'), {
            center: { lat: 28.5383, lng: -81.3792 }, // Começa em Orlando por defeito!
            zoom: 10,
            disableDefaultUI: true,
            zoomControl: true
        });
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: transMap,
            suppressMarkers: false,
            polylineOptions: { strokeColor: '#0c4a6e', strokeWeight: 4 }
        });

        // Autocomplete para Origem e Destino
        const autoOrigin = new google.maps.places.Autocomplete(document.getElementById('transOrigin'));
        const autoDest = new google.maps.places.Autocomplete(document.getElementById('transDest'));
    }

    // Se estivermos a editar um bilhete existente...
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

            // Se já tiver origem e destino, traça a rota automaticamente!
            if (trans.origin && trans.dest) calcTransportRoute();
        }
    } else {
        delete modal.dataset.editingId;
    }
}

// A MÁGICA DA ROTA (Chamada pelo botão "Calcular Rota")
export function calcTransportRoute() {
    if (!directionsService) return;

    const origin = document.getElementById('transOrigin').value;
    const dest = document.getElementById('transDest').value;
    const type = document.getElementById('transType').value;

    if (!origin || !dest) {
        alert("Preencha a origem e o destino para calcular a rota!");
        return;
    }

    // Define como vamos viajar
    let travelMode = google.maps.TravelMode.DRIVING;
    if (type === 'train') travelMode = google.maps.TravelMode.TRANSIT;
    if (type === 'flight') travelMode = google.maps.TravelMode.FLYING; // O Google não faz rotas de voo assim, tratamos abaixo

    document.getElementById('mapPlaceholder').classList.add('hidden');

    // Se for um Voo (Flight), a API de rotas falha. Então fazemos algo especial:
    if (type === 'flight') {
        alert("Voos são directos! O mapa marcará os aeroportos sem rota terrestre.");
        directionsRenderer.setDirections({routes: []}); // Limpa rotas antigas
        // Aqui poderíamos usar o Geocoder para pôr 2 pins, mas por simplicidade deixamos o mapa livre.
        return;
    }

    // Pede a rota ao Google
    directionsService.route({
        origin: origin,
        destination: dest,
        travelMode: travelMode
    }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
            
            // Mostra o quadro de distância e tempo!
            const route = response.routes[0].legs[0];
            document.getElementById('routeDistance').innerText = route.distance.text;
            document.getElementById('routeDuration').innerText = route.duration.text;
            document.getElementById('routeInfoOverlay').classList.remove('hidden');
        } else {
            alert("Não foi possível traçar uma rota por terra/mar entre estes locais.");
        }
    });
}

// GUARDA O BILHETE (E OS CUSTOS PARA AS FINANÇAS)
export async function saveTransport() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    const d = t.days.find(x => x.id === currentState.dayId);
    if (!d) return;

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
        paid: document.getElementById('transPaid').checked
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