// --- ROTEADOR MESTRE: CONTROLO DE ACESSO E VIEWS ---
import { currentState, setCurrentState } from './store.js';
import { closeModals } from './utils.js';
import { currentUser, authInitialized } from './auth.js'; 

// 🛑 LISTA VIP: Apenas estes e-mails passam da porta
const VIP_LIST = [
    'gilsonmarcondes@gmail.com',
    'gilson.marcondes@unesp.br',
    'amigo2@gmail.com'
];

/**
 * Navega para uma página e atualiza o estado
 */
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

/**
 * Motor de Renderização Principal
 */
export function render() {
    const app = document.getElementById('app');
    if (!app) return;

    // --- ESTÁGIO 1: AGUARDANDO RESPOSTA DO FIREBASE ---
    if (!authInitialized) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh]">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
                <p class="text-blue-900 font-bold animate-pulse uppercase tracking-widest text-xs font-mono">Consultando o Mapa do Maroto...</p>
            </div>`;
        return;
    }

    // --- ESTÁGIO 2: NINGUÉM LOGADO ---
    if (!currentUser) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4 animate-fade-in">
                <div class="text-center bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100">
                    <span class="text-7xl mb-6 block">✈️</span>
                    <h1 class="font-magic text-4xl text-[#0c4a6e] mb-2 uppercase font-bold tracking-tighter">Magic Planner</h1>
                    <p class="text-xs text-gray-400 mb-10 font-mono uppercase tracking-widest font-bold">Trip Organizer v2.5</p>
                    
                    <button onclick="window.loginUser()" class="w-full flex items-center justify-center gap-4 bg-white text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-md border border-gray-200 hover:bg-gray-50 hover:shadow-lg transition-all active:scale-95">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-6 h-6" alt="Google">
                        Entrar com Google
                    </button>
                </div>
            </div>`;
        
        const nav = document.getElementById('bottomNav');
        if (nav) { nav.classList.add('hidden'); nav.style.display = 'none'; }
        return; 
    }

    // --- ESTÁGIO 3: LOGADO, MAS É UM "PENETRA" (NÃO VIP) ---
    const emailNormalizado = (currentUser.email || "").toLowerCase().trim();
    if (!VIP_LIST.includes(emailNormalizado)) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4">
                <div class="text-center bg-red-50 p-10 rounded-3xl shadow-2xl max-w-sm w-full border-2 border-red-200">
                    <span class="text-8xl mb-6 block">🚫</span>
                    <h1 class="font-magic text-3xl text-red-700 mb-4 uppercase font-bold leading-tight">Acesso Interditado</h1>
                    <p class="text-sm text-red-800 mb-10 font-mono leading-relaxed">
                        Desculpe, Gilson. O e-mail <br><b class="text-blue-900 break-all">${emailNormalizado}</b><br> não está na lista VIP desta missão.
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

    // --- ESTÁGIO 4: ACESSO TOTAL (USUÁRIO VIP) ---
    app.innerHTML = '';
    const scrollY = window.scrollY;

    // Switch de Views com Lazy Loading (Carrega apenas o que precisa)
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
                // Restaura o scroll para não perder a posição ao marcar itens
                requestAnimationFrame(() => window.scrollTo(0, scrollY));
            });
            break;
        case 'new':
            renderNewTrip(app);
            break;
        default:
            import('./views/home.js').then(m => m.renderHome(app));
    }

    // Controle da Barra de Navegação Inferior
    const nav = document.getElementById('bottomNav');
    if (nav) {
        const isHiddenPage = currentState.page === 'home' || currentState.page === 'new';
        nav.classList.toggle('hidden', isHiddenPage);
        nav.style.display = isHiddenPage ? 'none' : 'flex';
    }
}

/**
 * Helper: Interface de criação de nova viagem
 */
function renderNewTrip(container) {
    container.innerHTML = `
        <div class="card p-8 max-w-lg mx-auto mt-10 bg-white rounded-3xl shadow-xl border border-gray-100">
            <h2 class="text-3xl font-magic mb-8 text-center uppercase text-[#0c4a6e] font-bold tracking-tight">Nova Aventura</h2>
            <div class="space-y-5">
                <input id="newName"  class="w-full p-4 border border-gray-200 rounded-2xl shadow-inner focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome (Ex: Londres & Paris)">
                <input id="newDest"  class="w-full p-4 border border-gray-200 rounded-2xl shadow-inner focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Destino Principal">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] uppercase font-bold text-gray-400 mb-2 block ml-2">Início</label>
                        <input id="newStart" type="date" class="w-full p-4 border border-gray-200 rounded-2xl shadow-inner text-sm font-mono">
                    </div>
                    <div>
                        <label class="text-[10px] uppercase font-bold text-gray-400 mb-2 block ml-2">Fim</label>
                        <input id="newEnd"   type="date" class="w-full p-4 border border-gray-200 rounded-2xl shadow-inner text-sm font-mono">
                    </div>
                </div>
                <div class="flex gap-3 pt-6">
                    <button onclick="window.createTrip()" class="flex-1 bg-[#0c4a6e] text-white font-bold p-4 rounded-2xl shadow-lg hover:bg-blue-900 transition active:scale-95 uppercase text-xs tracking-widest">Criar</button>
                    <button onclick="window.goTo('home')" class="flex-1 bg-gray-50 text-gray-500 border border-gray-200 font-bold p-4 rounded-2xl hover:bg-gray-100 transition uppercase text-xs tracking-widest">Cancelar</button>
                </div>
            </div>
        </div>`;
}