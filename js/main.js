// --- ENTRY POINT ---
import { loadData, saveData, appData, setAttractionQuill } from './store.js';
import { render, goTo, openTrip, openDay }   from './router.js';
import { exportDataAsJson, closeModals }     from './utils.js';
import { initAuth, loginUser, logoutUser } from './auth.js';

// Importação das Views e Modals (Mantenha todos os seus outros imports aqui)
// ...

// --- EXPOSIÇÃO GLOBAL ---
Object.assign(window, {
    loginUser, logoutUser, goTo, openTrip, openDay, render, closeModals,
    // (Adicione todas as suas outras funções aqui como você já tinha feito)
});
 
// --- INICIALIZAÇÃO ---
function init() {
    console.log("🚀 Sistema: Iniciando motor principal...");
    render(); // Inicia o carregamento

    initAuth(() => {
        console.log("✅ VIP detectado. Carregando dados...");
        try {
            loadData();
            const editorEl = document.getElementById('attDescEditor');
            if (editorEl && typeof Quill !== 'undefined') {
                const quill = new Quill('#attDescEditor', { theme: 'snow' });
                setAttractionQuill(quill);
            }
            const params = new URLSearchParams(window.location.search);
            const urlTrip = params.get('tripId');
            if (urlTrip) goTo('trip', urlTrip); else render();
        } catch (e) { 
            console.error('❌ Erro no carregamento:', e); 
            render(); 
        }
    });
}

document.addEventListener('DOMContentLoaded', init);