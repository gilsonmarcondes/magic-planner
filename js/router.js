// --- ROTEADOR OTIMIZADO ---
import { currentState, setCurrentState } from './store.js';
import { closeModals } from './utils.js';
// AQUI: Importamos o usuário para saber se ele está logado
import { currentUser } from './auth.js'; 

/**
 * Navega para uma página específica e limpa o estado anterior
 */
export function goTo(page, tripId = null, dayId = null) {
    // 1. FECHAR MODAIS: Garante que a transição seja limpa
    closeModals();

    // 2. ATUALIZAR ESTADO
    setCurrentState({ page });
    if (tripId) setCurrentState({ tripId });
    if (dayId)  setCurrentState({ dayId });

    // 3. RENDERIZAR
    render();

    // 4. VOLTAR AO TOPO: Importante para a experiência do utilizador
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

    // --- A MÁGICA DO LOGIN ACONTECE AQUI ---
    // Se não tiver ninguém logado, mostra a tela de login (o botão do Google) e para.
    if (!currentUser) {
        app.innerHTML = `
            <div class="flex flex-col justify-center items-center min-h-[80vh] px-4">
                <div class="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
                    <span class="text-6xl mb-4 block">✈️</span>
                    <h1 class="font-magic text-4xl text-[#0c4a6e] mb-2 uppercase font-bold">Magic Planner</h1>
                    <p class="text-sm text-gray-500 mb-8 font-mono">Organize suas aventuras de forma inteligente.</p>
                    
                    <button onclick="window.loginUser()" class="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-bold py-3 px-4 rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 hover:shadow-lg transition-all active:scale-95">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-5 h-5" alt="Google">
                        Entrar com Google
                    </button>
                    
                    <p class="text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">Versão 2.0</p>
                </div>
            </div>`;
        
        // Esconde o menu inferior se estiver na tela de login
        const nav = document.getElementById('bottomNav');
        if (nav) { nav.classList.add('hidden'); nav.style.display = 'none'; }
        return; 
    }

    // Se estiver logado, continua a renderização normal
    const scrollY = window.scrollY;
    app.innerHTML = '';

    // Switch de Views com Lazy Loading
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
                // Restaura o scroll apenas se estivermos na mesma página
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
        // Ocultar na Home e na criação de nova viagem
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
                        <label class="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Início</label>
                        <input id="newStart" type="date" class="w-full p-3 border border-gray-300 rounded-lg shadow-sm font-mono text-sm text-gray-600">
                    </div>
                    <div>
                        <label class="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Fim</label>
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