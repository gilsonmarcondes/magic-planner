import { currentState, setCurrentState } from './store.js';
import { closeModals } from './utils.js';
import { currentUser, authInitialized, logoutUser } from './auth.js'; 

// 🛑 COLOQUE OS 3 EMAILS AQUI (Exatamente como são, em minúsculas)
const VIP_LIST = [
    'gilsonmarcondes@gmail.com',
    'gilson.marcondes@unesp.br',
    'email3@gmail.com'
];

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

    // --- 1. ESTADO DE ESPERA ---
    // Se o Firebase ainda não confirmou quem é o usuário, mostra um carregamento
    if (!authInitialized) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh]">
                <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                <p class="text-blue-900 font-bold animate-pulse">Consultando o Mapa do Maroto...</p>
            </div>`;
        return;
    }

    // --- 2. SE NÃO ESTIVER LOGADO -> Tela de Login ---
    if (!currentUser) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4">
                <div class="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
                    <span class="text-6xl mb-4 block">✈️</span>
                    <h1 class="font-magic text-4xl text-[#0c4a6e] mb-2 uppercase font-bold text-center">Magic Planner</h1>
                    <button onclick="window.loginUser()" class="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-bold py-3 px-4 rounded-xl shadow-md border border-gray-200 mt-6 active:scale-95 hover:bg-gray-50 transition">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-5 h-5">
                        Entrar com Google
                    </button>
                </div>
            </div>`;
        return;
    }

    // --- 3. SE LOGADO MAS NÃO FOR VIP -> Tela Vermelha ---
    const userEmail = (currentUser.email || "").toLowerCase().trim();
    if (!VIP_LIST.includes(userEmail)) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4">
                <div class="text-center bg-red-50 p-8 rounded-2xl shadow-2xl max-w-sm w-full border-2 border-red-200">
                    <span class="text-7xl mb-4 block">🚫</span>
                    <h1 class="font-magic text-3xl text-red-700 mb-2 uppercase font-bold text-center">Acesso Negado</h1>
                    <p class="text-sm text-red-800 mb-8 font-mono text-center">O e-mail <br><b>${userEmail}</b><br> não está autorizado.</p>
                    <button onclick="window.logoutUser()" class="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-xl uppercase text-xs">Sair e Tentar Outro</button>
                </div>
            </div>`;
        return;
    }

    // --- 4. SE FOR VIP -> Carrega o App ---
    app.innerHTML = '';
    const scrollY = window.scrollY;

    switch (currentState.page) {
        case 'home': import('./views/home.js').then(m => m.renderHome(app)); break;
        case 'trip': import('./views/trip.js').then(m => m.renderTrip(app, currentState.tripId)); break;
        case 'day':  import('./views/day.js').then(m => {
            m.renderDay(app, currentState.tripId, currentState.dayId);
            requestAnimationFrame(() => window.scrollTo(0, scrollY));
        }); break;
        case 'new':  renderNewTrip(app); break;
        default:     import('./views/home.js').then(m => m.renderHome(app));
    }

    const nav = document.getElementById('bottomNav');
    if (nav) {
        const isHidden = currentState.page === 'home' || currentState.page === 'new';
        nav.classList.toggle('hidden', isHidden);
        nav.style.display = isHidden ? 'none' : 'flex';
    }
}

function renderNewTrip(container) {
    container.innerHTML = `<div class="card p-8 max-w-lg mx-auto mt-10"><h2 class="text-2xl font-magic mb-6 text-center uppercase">Nova Aventura</h2><button onclick="window.createTrip()" class="bg-[#0c4a6e] text-white p-3 rounded-lg w-full font-bold">Criar</button></div>`;
}