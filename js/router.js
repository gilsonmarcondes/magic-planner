// --- ROTEADOR OPTIMIZADO ---
import { currentState, setCurrentState } from './store.js';
import { closeModals } from './utils.js';

/**
 * Navega para uma página específica e limpa o estado anterior
 */
export function goTo(page, tripId = null, dayId = null) {
    // 1. FECHAR MODAIS: Garante que a transição seja limpa
    closeModals();

    // 2. ACTUALIZAR ESTADO
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

    // Guardar a posição do scroll para a View de "Day" (útil ao marcar itens como 'feito')
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
        
        // Destaque visual: Opcional - pode adicionar uma classe 'active' ao botão actual aqui
    }
}

/**
 * Interface simples para criar nova viagem
 */
function renderNewTrip(container) {
    container.innerHTML = `
        <div class="card p-8 max-w-lg mx-auto mt-10">
            <h2 class="text-2xl font-magic mb-6 text-center uppercase">Nova Aventura</h2>
            <div class="space-y-4">
                <input id="newName"  class="w-full p-2 border rounded" placeholder="Nome da Viagem (Ex: Eurotrip)">
                <input id="newDest"  class="w-full p-2 border rounded" placeholder="Destino Principal">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] uppercase font-bold text-gray-400">Início</label>
                        <input id="newStart" type="date" class="w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="text-[10px] uppercase font-bold text-gray-400">Fim</label>
                        <input id="newEnd"   type="date" class="w-full p-2 border rounded">
                    </div>
                </div>
                <div class="flex gap-2 pt-4">
                    <button onclick="window.createTrip()" class="btn btn-primary w-full justify-center">Criar</button>
                    <button onclick="window.goTo('home')" class="btn bg-gray-200 text-gray-800 w-full justify-center">Cancelar</button>
                </div>
            </div>
        </div>`;
}