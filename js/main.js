import { loadData, saveData, appData, setAttractionQuill } from './store.js';
import { render, goTo, openTrip, openDay }   from './router.js';
import { exportDataAsJson, closeModals }     from './utils.js';
import { initAuth, loginUser, logoutUser } from './auth.js';

// ... (seus outros imports)

Object.assign(window, { loginUser, logoutUser, goTo, openTrip, openDay, render, closeModals });
 
function init() {
    console.log("🚀 Sistema: Iniciando motor principal...");
    render(); 
    initAuth(() => {
        try {
            loadData();
            const params = new URLSearchParams(window.location.search);
            const urlTrip = params.get('tripId');
            if (urlTrip) goTo('trip', urlTrip); else render();
        } catch (e) { console.error('❌ Erro:', e); render(); }
    });
}
document.addEventListener('DOMContentLoaded', init);