// ============================================================
// main.js — PONTO DE ENTRADA DA APLICAÇÃO (Bootstrap)
// ============================================================
import { initAuth, loginUser, logoutUser } from './auth.js';
import { render, goTo, openTrip, openDay } from './router.js';
import { loadData, currentState } from './store.js';
import { closeModals, exportDataAsJson } from './utils.js';

// --- Funções globais base ---
window.render          = render;
window.goTo            = goTo;
window.openTrip        = openTrip;
window.openDay         = openDay;
window.loginUser       = loginUser;
window.logoutUser      = logoutUser;
window.closeModals     = closeModals;
window.exportDataAsJson = exportDataAsJson;
window.currentState    = currentState;

// --- View: Home (lista de viagens + modal de viagem) ---
import('./views/home.js').then(m => {
    window.renderHome    = m.renderHome;
    window.openTripModal = m.openTripModal;
    window.saveTrip      = m.saveTrip;
    window.deleteTrip    = m.deleteTrip;
    window.importData    = m.importData;
});

// --- View: Trip (dias da viagem) ---
import('./views/trip.js').then(m => {
    window.addDay        = m.addDay;
    window.deleteDay     = m.deleteDay;
    window.addBucketList = m.addBucketList;
});

// --- View: Day (atrações, locais, etc.) ---
import('./views/day.js').then(m => {
    window.renameDay              = m.renameDay;
    window.toggleVisited          = m.toggleVisited;
    window.deleteAttraction       = m.deleteAttraction;
    window.setInlineMode          = m.setInlineMode;
    window.toggleRoutePanel       = m.toggleRoutePanel;
    window.toggleTicketContent    = m.toggleTicketContent;
    window.toggleMarauderMap      = m.toggleMarauderMap;
    window.setMarauderMap         = m.setMarauderMap;
    window.deleteDayExtra         = m.deleteDayExtra;
    window.openBatchMoveCopy      = m.openBatchMoveCopy;
    window.toggleSelectAllAttractions = m.toggleSelectAllAttractions;
    window.sortAttractionsByPriority  = m.sortAttractionsByPriority;
});

// --- Feature: Mapas / Localização ---
import('./features/maps.js').then(m => {
    window.openCitySearch         = m.openCitySearch;
    window.addLocation            = m.addLocation;
    window.removeLocation         = m.removeLocation;
    window.fetchWeather           = m.fetchWeather;
    window.openFullDayRoute       = m.openFullDayRoute;
    window.initOriginAutocomplete = m.initOriginAutocomplete;
    window.calcInlineRoute        = m.calcInlineRoute;
    window.openGPSRoute           = m.openGPSRoute;
    window.useMyLocation          = m.useMyLocation;
    window.openRadarModal         = m.openRadarModal;
    window.scanRadar              = m.scanRadar;
});

// --- Feature: IA ---
import('./features/ai.js').then(m => {
    window.fetchAIFacts = m.fetchAIFacts;
});

// --- Feature: Wikipedia ---
import('./features/wiki.js').then(m => {
    window.fetchWikipediaData  = m.fetchWikipediaData;
    window.handleWikiInput     = m.handleWikiInput;
    window.selectWikiSuggestion = m.selectWikiSuggestion;
    window.quickShowHistory    = m.quickShowHistory;
});

// --- Modal: Atrações ---
import('./modals/attraction.js').then(m => {
    window.openAttractionModal = m.openAttractionModal;
    window.addTempCost         = m.addTempCost;
    window.saveAttraction      = m.saveAttraction;
});

// --- Modal: Transporte ---
import('./modals/transport.js').then(m => {
    window.openTransportModal = m.openTransportModal;
    window.addRouteStep       = m.addRouteStep;
    window.calcTransportRoute = m.calcTransportRoute;
    window.saveTransport      = m.saveTransport;
    window.deleteTransport    = m.deleteTransport;
});

// --- Modal: Finanças ---
import('./modals/finance.js').then(m => {
    window.openFinanceModal    = m.openFinanceModal;
    window.switchFinanceTab    = m.switchFinanceTab;
    window.saveRates           = m.saveRates;
    window.addInitialCost      = m.addInitialCost;
    window.deleteInitialCost   = m.deleteInitialCost;
    window.renderReport        = m.renderReport;
    window.syncHistoricalRates = m.syncHistoricalRates;
    window.fetchHistoricalRate = m.fetchHistoricalRate;
});

// --- Modal: Hotéis ---
import('./modals/hotel.js').then(m => {
    window.openHotelManager = m.openHotelManager;
    window.editHotel        = m.editHotel;
    window.deleteHotel      = m.deleteHotel;
});

// --- Modal: Misc (checklist, documentos, search, extras) ---
import('./modals/misc.js').then(m => {
    window.openChecklist        = m.openChecklist;
    window.addCheckItem         = m.addCheckItem;
    window.toggleCheckItem      = m.toggleCheckItem;
    window.deleteCheckItem      = m.deleteCheckItem;
    window.openMoveCopyModal    = m.openMoveCopyModal;
    window.confirmMoveCopy      = m.confirmMoveCopy;
    window.openDocumentsModal   = m.openDocumentsModal;
    window.saveDocument         = m.saveDocument;
    window.deleteDocument       = m.deleteDocument;
    window.copyDocument         = m.copyDocument;
    window.openSearchModal      = m.openSearchModal;
    window.performGlobalSearch  = m.performGlobalSearch;
    window.openDayExtraModal    = m.openDayExtraModal;
    window.saveDayExtra         = m.saveDayExtra;
});

// --- INICIALIZA O APP ---
initAuth(loadData);
