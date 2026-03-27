// --- MAIN.JS: O MAESTRO DO SISTEMA ---
import { auth, provider } from './firebase.js';
import { onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { loadData } from './store.js';

// Importação das funcionalidades de outros arquivos
import { openTripModal, saveTrip, deleteTrip } from './modals/trip.js';
import { openDayModal, saveDay, deleteDay } from './modals/day.js';
import { openAttractionModal, saveAttraction, addTempCost } from './modals/attraction.js';
import { 
    fetchWeather, openCitySearch, addLocation, removeLocation, 
    openFullDayRoute, calcInlineRoute, openGPSRoute, 
    useMyLocation, openRadarModal, scanRadar 
} from './features/maps.js';

// 1. MONITOR DE LOGIN
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ Usuário VIP detectado:", user.email);
        await loadData(); 
    } else {
        console.log("👤 Aguardando login...");
        if (window.render) window.render(); 
    }
});

// 2. LIGAÇÃO COM O HTML (Faz os botões funcionarem)
window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);

// Modais
window.openTripModal = openTripModal;
window.saveTrip = saveTrip;
window.deleteTrip = deleteTrip;
window.openDayModal = openDayModal;
window.saveDay = saveDay;
window.deleteDay = deleteDay;
window.openAttractionModal = openAttractionModal;
window.saveAttraction = saveAttraction;
window.addTempCost = addTempCost;

// Mapas e Clima
window.fetchWeather = fetchWeather;
window.openCitySearch = openCitySearch;
window.addLocation = addLocation;
window.removeLocation = removeLocation;
window.openFullDayRoute = openFullDayRoute;
window.calcInlineRoute = calcInlineRoute;
window.openGPSRoute = openGPSRoute;
window.useMyLocation = useMyLocation;
window.openRadarModal = openRadarModal;
window.scanRadar = scanRadar;

console.log("🚀 Sistema: Motor principal iniciado com sucesso!");