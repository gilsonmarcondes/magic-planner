// --- ROTEADOR COM SEGURANÇA VIP ---
import { currentState, setCurrentState } from './store.js';
import { closeModals } from './utils.js';
// Importamos o usuário e a função de logout do auth.js
import { currentUser, logoutUser } from './auth.js'; 

// 🛑 SUA LISTA VIP: Coloque aqui os e-mails autorizados
const VIP_LIST = [
    'seuemail@gmail.com',
    'amigo1@gmail.com',
    'amigo2@gmail.com'
];

/**
 * Navega para uma página específica
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
 * Motor de renderização principal
 */
export function render() {
    const app = document.getElementById('app');
    if (!app) return;

    // --- 1. BLOQUEIO DE SEGURANÇA: NINGUÉM LOGADO ---
    if (!currentUser) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4">
                <div class="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
                    <span class="text-6xl mb-4 block">✈️</span>
                    <h1 class="font-magic text-4xl text-[#0c4a6e] mb-2 uppercase font-bold text-center">Magic Planner</h1>
                    <p class="text-sm text-gray-500 mb-8 font-mono text-center">Organize suas aventuras de forma inteligente.</p>
                    
                    <button onclick="if(window.loginUser){ window.loginUser(); } else { alert('Aguarde um instante...'); }" class="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-bold py-3 px-4 rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-all active:scale-95">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-5 h-5" alt="Google">
                        Entrar com Google
                    </button>
                    <p class="text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold text-center">Versão 2.1</p>
                </div>
            </div>`;
        
        const nav = document.getElementById('bottomNav');
        if (nav) { nav.classList.add('hidden'); nav.style.display = 'none'; }
        return; 
    }

    // --- 2. BLOQUEIO DE SEGURANÇA: LOGADO MAS NÃO É VIP ---
    const emailNormalizado = currentUser.email.toLowerCase().trim();
    if (!VIP_LIST.includes(emailNormalizado)) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4 animate-fade-in">
                <div class="text-center bg-red-50 p-8 rounded-2xl shadow-2xl max-w-sm w-full border-2 border-red-200">
                    <span class="text-7xl mb-4 block">🚫</span>
                    <h1 class="font-magic text-3xl text-red-700 mb-2 uppercase font-bold text-center">Acesso Negado</h1>
                    <p class="text-sm text-red-800 mb-8 font-mono text-center italic">
                        O e-mail <br><b class="text-blue-900">${emailNormalizado}</b><br> não está na lista VIP desta viagem.
                    </p>
                    <button onclick="window.logoutUser()" class="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-red-700 transition active:scale-95 uppercase tracking-widest text-xs">
                        Sair da Conta
                    </button>
                </div>
            </div>`;
        
        const nav = document.getElementById('bottomNav');
        if (nav) { nav.classList.add('hidden'); nav.style.display = 'none'; }
        return; 
    }

    // --- 3. SE PASSOU NO VIP, RENDERIZA O CONTEÚDO ---
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

    // GESTÃO DO MENU INFERIOR (Bottom Nav)
    const nav = document.getElementById('bottomNav');
    if (nav) {
        const isHiddenPage = currentState.page === 'home' || currentState.page === 'new';
        nav.classList.toggle('hidden', isHiddenPage);
        nav.style.display = isHiddenPage ? 'none' : 'flex';
    }
}

/**
 * Interface simples para criar nova viagem
 */
function renderNewTrip(container) {
    container.innerHTML = `
        <div class="card p-8 max-w-lg mx-auto mt-10">
            <h2 class="text-2xl font-magic mb-6 text-center uppercase text-[#0c4a6e] font-bold">Nova Aventura</h2>
            <div class="space-y-4">
                <input id="newName"  class="w-full p-3 border border-gray-300 rounded-lg shadow-sm" placeholder="Nome da Viagem (Ex: Eurotrip)">
                <input id="newDest"  class="w-full p-3 border border-gray-300 rounded-lg shadow-sm" placeholder="Destino Principal">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] uppercase font-bold text-gray-400 mb-1 block text-center">Início</label>
                        <input id="newStart" type="date" class="w-full p-3 border border-gray-300 rounded-lg shadow-sm font-mono text-sm text-gray-600">
                    </div>
                    <div>
                        <label class="text-[10px] uppercase font-bold text-gray-400 mb-1 block text-center">Fim</label>
                        <input id="newEnd"   type="date" class="w-full p-3 border border-gray-300 rounded-lg shadow-sm font-mono text-sm text-gray-600">
                    </div>
                </div>
                <div class="flex gap-2 pt-4">
                    <button onclick="window.createTrip()" class="flex-1 bg-[#0c4a6e] text-white font-bold p-3 rounded-lg shadow-md hover:bg-blue-900 transition">Criar</button>
                    <button onclick="window.goTo('home')" class="flex-1 bg-white text-gray-600 border border-gray-300 font-bold p-3 rounded-lg shadow-sm hover:bg-gray-50 transition">Cancelar</button>
                </div>
            </div>
        </div>`;
}