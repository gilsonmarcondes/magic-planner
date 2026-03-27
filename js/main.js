// --- ENTRY POINT ---
import { loadData, saveData, appData, setAttractionQuill } from './store.js';
import { render, goTo, openTrip, openDay }   from './router.js';
import { exportDataAsJson, closeModals }     from './utils.js';
import { initAuth, loginUser, logoutUser } from './auth.js';

// ... (Mantenha todas as suas outras importações de Views, Modals e Features aqui) ...

// --- EXPOSIÇÃO GLOBAL ---
Object.assign(window, {
    loginUser, logoutUser, goTo, openTrip, openDay, render, closeModals,
    // (Adicione aqui todas as outras funções que você já tinha exposto)
});
 
// --- INICIALIZAÇÃO ---
function init() {
    console.log("🚀 Sistema: Iniciando motor principal...");
    render(); // Inicia o carregamento imediatamente

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