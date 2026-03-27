// --- ENTRY POINT ---
import { loadData, saveData, appData, setAttractionQuill } from './store.js';
import { render, goTo, openTrip, openDay }   from './router.js';
import { exportDataAsJson, closeModals }     from './utils.js';
import { initAuth, loginUser, logoutUser } from './auth.js';

// Views
import { createTrip, editTripMetadata, deleteTrip, importData } from './views/home.js';
import { addDay, addBucketList, deleteDay }                     from './views/trip.js';
import { renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
         setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
         setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions }    from './views/day.js';

// Modals
import { openAttractionModal, saveAttraction, addTempCost } from './modals/attraction.js';
// AQUI: Importamos as funções do novo Bilhete Nível Google Maps
import { openTransportModal, addRouteStep, calcTransportRoute, saveTransport, deleteTransport } from './modals/transport.js';
import { openHotelManager, saveHotel, editHotel, deleteHotel } from './modals/hotel.js';
import { openFinanceModal, switchFinanceTab, saveRates, addInitialCost, deleteInitialCost, syncHistoricalRates, renderReport } from './modals/finance.js';
import { openDayExtraModal, saveDayExtra, openChecklist, addCheckItem,
         toggleCheckItem, deleteCheckItem, openDocumentsModal, saveDocument,
         deleteDocument, copyDocument, openSearchModal, performGlobalSearch,
         openMoveCopyModal, prepareMoveModal, confirmMoveCopy }              from './modals/misc.js';

// Features
import { openCitySearch, addLocation, removeLocation, fetchWeather,
         openFullDayRoute, calcInlineRoute, openGPSRoute,
         useMyLocation, initOriginAutocomplete, openRadarModal, scanRadar }  from './features/maps.js';
import { fetchWikipediaData, handleWikiInput, selectWikiSuggestion, quickShowHistory } from './features/wiki.js';
import { fetchAIFacts } from './features/ai.js';
import { generatePDF, generateDayPDF, generateCalendarPDF, generateVisitedKML, generateICS } from './features/export.js';

// --- EXPOSIÇÃO GLOBAL (A "FIAÇÃO") ---
Object.assign(window, {
    // Auth & Router
    loginUser, logoutUser, goTo, openTrip, openDay, render, closeModals,
    
    // Home & Trip Management
    createTrip, editTripMetadata, deleteTrip, importData,
    exportData: () => exportDataAsJson(appData),
    addDay, addBucketList, deleteDay,
    
    // Day View Actions
    renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
    setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
    setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions,
    
    // Modals: Attraction & Transport
    openAttractionModal, saveAttraction, addTempCost,
    // AQUI: Exposição das funções de transporte para os botões do HTML
    openTransportModal, addRouteStep, calcTransportRoute, saveTransport, deleteTransport,
    
    // Modals: Hotels
    openHotelManager, saveHotel, editHotel, deleteHotel,
    
    // Modals: Finance
    openFinanceModal, switchFinanceTab, saveRates, addInitialCost, deleteInitialCost, syncHistoricalRates, renderReport,
    
    // Modals: Misc
    openDayExtraModal, saveDayExtra, openChecklist, addCheckItem,
    toggleCheckItem, deleteCheckItem, openDocumentsModal, saveDocument,
    deleteDocument, copyDocument, openSearchModal, performGlobalSearch,
    openMoveCopyModal, prepareMoveModal, confirmMoveCopy,
    
    // Features: Maps & Weather
    openCitySearch, addLocation, removeLocation, fetchWeather,
    openFullDayRoute, calcInlineRoute, openGPSRoute,
    useMyLocation, initOriginAutocomplete, openRadarModal, scanRadar,
    
    // Features: AI, Wiki & Export
    fetchWikipediaData, handleWikiInput, selectWikiSuggestion, quickShowHistory, fetchAIFacts,
    generatePDF, generateDayPDF, generateCalendarPDF, generateVisitedKML, generateICS
});
 
// --- INICIALIZAÇÃO ---
function init() {
    initAuth(() => {
        try {
            loadData();
            // Inicializa o Quill se o elemento existir
            const editorEl = document.getElementById('attDescEditor');
            if (editorEl && typeof Quill !== 'undefined') {
                const quill = new Quill('#attDescEditor', { theme: 'snow' });
                setAttractionQuill(quill);
            }
            
            const params = new URLSearchParams(window.location.search);
            const urlTrip = params.get('tripId');
            if (urlTrip) goTo('trip', urlTrip); else render();
        } catch (e) { 
            console.error('Erro ao inicializar:', e); 
            render(); 
        }
    });
}

document.addEventListener('DOMContentLoaded', init);