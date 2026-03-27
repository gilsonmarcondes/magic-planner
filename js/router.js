import { currentState, setCurrentState } from './store.js';
import { closeModals } from './utils.js';
import { currentUser, authInitialized } from './auth.js'; 

export function goTo(page, tripId = null, dayId = null) {
    closeModals();
    setCurrentState({ page });
    if (tripId) setCurrentState({ tripId });
    if (dayId)  setCurrentState({ dayId });
    render();
}

export function openTrip(id) { goTo('trip', id); }
export function openDay(tripId, dayId) { goTo('day', tripId, dayId); }

export function render() {
    const app = document.getElementById('app');
    if (!app) return;

    // 1. ESPERANDO O FIREBASE
    if (!authInitialized) {
        app.innerHTML = `<div class="flex flex-col items-center justify-center min-h-[80vh]"><div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div></div>`;
        return;
    }

    // 2. TELA DE LOGIN (Se não houver usuário)
    if (!currentUser) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4">
                <div class="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
                    <span class="text-6xl mb-4 block">✈️</span>
                    <h1 class="font-magic text-4xl text-[#0c4a6e] mb-8 uppercase font-bold text-center">Magic Planner</h1>
                    <button onclick="window.loginUser()" class="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-bold py-3 px-4 rounded-xl shadow-md border border-gray-200 active:scale-95">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-5 h-5">
                        Entrar com Google
                    </button>
                </div>
            </div>`;
        return;
    }

    // 3. RENDERIZAÇÃO DAS PÁGINAS (VIP já garantido pelo Auth)
    app.innerHTML = '';
    const scrollY = window.scrollY;

    switch (currentState.page) {
        case 'home': import('./views/home.js').then(m => m.renderHome(app)); break;
        case 'trip': import('./views/trip.js').then(m => m.renderTrip(app, currentState.tripId)); break;
        case 'day':  import('./views/day.js').then(m => {
            m.renderDay(app, currentState.tripId, currentState.dayId);
            requestAnimationFrame(() => window.scrollTo(0, scrollY));
        }); break;
        default:     import('./views/home.js').then(m => m.renderHome(app));
    }

    const nav = document.getElementById('bottomNav');
    if (nav) {
        const isHidden = currentState.page === 'home' || currentState.page === 'new';
        nav.classList.toggle('hidden', isHidden);
        nav.style.display = isHidden ? 'none' : 'flex';
    }
}