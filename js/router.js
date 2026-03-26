// --- ROTEADOR ---
// As views são importadas de forma lazy para quebrar dependência circular
import { currentState, setCurrentState } from './store.js';

export function goTo(page, tripId = null, dayId = null) {
    setCurrentState({ page });
    if (tripId) setCurrentState({ tripId });
    if (dayId)  setCurrentState({ dayId });
    render();
    window.scrollTo(0, 0);
}

export function openTrip(id) { goTo('trip', id); }
export function openDay(tripId, dayId) { goTo('day', tripId, dayId); }

export function render() {
    const app = document.getElementById('app');
    if (!app) return;

    const scrollY = window.scrollY;

    app.innerHTML = '';

    switch (currentState.page) {
        case 'home':
            import('./views/home.js').then(m => m.renderHome(app));
            break;
        case 'trip':
            import('./views/trip.js').then(m => m.renderTrip(app, currentState.tripId));
            break;
        case 'day':
            import('./views/day.js').then(m => {
                m.renderDay(app, currentState.tripId, currentState.dayId);
                requestAnimationFrame(() => window.scrollTo(0, scrollY));
            });
            break;
        case 'new':
            renderNewTrip(app);
            break;
        default:
            import('./views/home.js').then(m => m.renderHome(app));
    }

    const nav = document.getElementById('bottomNav');
    if (nav) {
        const hide = currentState.page === 'home' || currentState.page === 'new';
        nav.classList.toggle('hidden', hide);
        nav.style.display = hide ? 'none' : 'flex';
    }
}

function renderNewTrip(container) {
    container.innerHTML = `
        <div class="card p-8 max-w-lg mx-auto mt-10">
            <h2 class="text-2xl font-magic mb-6 text-center uppercase">Nova Aventura</h2>
            <input id="newName"  class="w-full p-2 border rounded mb-3" placeholder="Nome da Viagem (Ex: Eurotrip)">
            <input id="newDest"  class="w-full p-2 border rounded mb-3" placeholder="Destino Principal">
            <div class="grid grid-cols-2 gap-4 mb-6">
                <input id="newStart" type="date" class="w-full p-2 border rounded">
                <input id="newEnd"   type="date" class="w-full p-2 border rounded">
            </div>
            <div class="flex gap-2">
                <button onclick="window.createTrip()"    class="btn btn-primary w-full justify-center">Criar</button>
                <button onclick="window.goTo('home')" class="btn bg-gray-200 text-gray-800 w-full justify-center">Cancelar</button>
            </div>
        </div>`;
}
