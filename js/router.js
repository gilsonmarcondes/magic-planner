import { currentState, setCurrentState } from './store.js';
import { closeModals } from './utils.js';
import { currentUser, authInitialized } from './auth.js'; 

export function goTo(page, tripId = null, dayId = null) {
    closeModals();
    setCurrentState({ page });
    if (tripId) setCurrentState({ tripId });
    if (dayId)  setCurrentState({ dayId });
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function openTrip(id) { goTo('trip', id); }
export function openDay(tripId, dayId) { goTo('day', tripId, dayId); }

export function render() {
    const app = document.getElementById('app');
    if (!app) return;

    // 1. ESTÁGIO DE CARREGAMENTO (Espera o authInitialized virar TRUE)
    if (!authInitialized) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh]">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
                <p class="text-blue-900 font-bold animate-pulse font-mono uppercase text-[10px]">Consultando o Mapa do Maroto...</p>
            </div>`;
        return;
    }

    // 2. TELA DE LOGIN (Se não houver usuário)
    if (!currentUser) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4 animate-fade-in">
                <div class="text-center bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100">
                    <span class="text-7xl mb-6 block">✈️</span>
                    <h1 class="font-magic text-4xl text-[#0c4a6e] mb-10 uppercase font-bold tracking-tighter text-center">Magic Planner</h1>
                    <button onclick="window.loginUser()" class="w-full flex items-center justify-center gap-4 bg-white text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-md border border-gray-200 hover:bg-gray-50 active:scale-95">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-6 h-6">
                        Entrar com Google
                    </button>
                </div>
            </div>`;
        const nav = document.getElementById('bottomNav');
        if (nav) { nav.classList.add('hidden'); nav.style.display = 'none'; }
        return; 
    }

    // 3. ACESSO NEGADO (Se o e-mail não for VIP)
    if (currentUser.isBarrado) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4 animate-fade-in">
                <div class="text-center bg-red-50 p-10 rounded-3xl shadow-2xl max-w-sm w-full border-2 border-red-200">
                    <span class="text-8xl mb-6 block">🚫</span>
                    <h1 class="font-magic text-3xl text-red-700 mb-4 uppercase font-bold text-center">Acesso Interditado</h1>
                    <p class="text-sm text-red-800 mb-10 font-mono text-center">
                        O e-mail <br><b class="text-blue-900 break-all">${currentUser.email}</b><br> não está na lista VIP desta missão.
                    </p>
                    <button onclick="window.logoutUser()" class="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-red-700 transition active:scale-95 uppercase tracking-widest text-xs">
                        Trocar de Conta
                    </button>
                </div>
            </div>`;
        const nav = document.getElementById('bottomNav');
        if (nav) { nav.classList.add('hidden'); nav.style.display = 'none'; }
        return; 
    }

    // 4. ACESSO LIBERADO (Renderização normal)
    app.innerHTML = '';
    const scrollY = window.scrollY;
    
    switch (currentState.page) {
        case 'home': import('./views/home.js').then(m => m.renderHome(app)); break;
        case 'trip': import('./views/trip.js').then(m => m.renderTrip(app, currentState.tripId)); break;
        case 'day':  import('./views/day.js').then(m => { m.renderDay(app, currentState.tripId, currentState.dayId); requestAnimationFrame(() => window.scrollTo(0, scrollY)); }); break;
        default:     import('./views/home.js').then(m => m.renderHome(app));
    }

    const nav = document.getElementById('bottomNav');
    if (nav) {
        const isHiddenPage = currentState.page === 'home' || currentState.page === 'new';
        nav.classList.toggle('hidden', isHiddenPage);
        nav.style.display = isHiddenPage ? 'none' : 'flex';
    }
}

export function renderNewTrip(container) {
    container.innerHTML = `<div class="card p-8 max-w-lg mx-auto mt-10 bg-white rounded-3xl shadow-xl border border-gray-100 text-center"><h2 class="text-3xl font-magic mb-8 uppercase text-[#0c4a6e] font-bold">Nova Aventura</h2><button onclick="window.createTrip()" class="bg-[#0c4a6e] text-white p-3 rounded-lg w-full font-bold uppercase text-xs">Criar</button></div>`;
}