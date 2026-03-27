import { loadData, saveData, appData, setAttractionQuill } from './store.js';
import { render, goTo, openTrip, openDay }   from './router.js';
import { exportDataAsJson, closeModals }     from './utils.js';
import { initAuth, loginUser, logoutUser } from './auth.js';

// Views
import { editTripMetadata, deleteTrip, importData } from './views/home.js';
import { addDay, addBucketList, deleteDay, openTripModal, saveTrip } from './views/trip.js'; 
import { renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
         setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
         setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions }    from './views/day.js';

// Modals
import { openAttractionModal, saveAttraction, addTempCost } from './modals/attraction.js';
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

// ✅ REGISTRO GLOBAL (Expondo as funções para o HTML)
Object.assign(window, {
    loginUser, logoutUser, goTo, openTrip, openDay, render, closeModals,
    editTripMetadata, deleteTrip, importData,
    openTripModal, saveTrip, 
    exportData: () => exportDataAsJson(appData),
    addDay, addBucketList, deleteDay,
    renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
    setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
    setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions,
    openAttractionModal, saveAttraction, addTempCost,
    openTransportModal, addRouteStep, calcTransportRoute, saveTransport, deleteTransport,
    openHotelManager, saveHotel, editHotel, deleteHotel,
    openFinanceModal, switchFinanceTab, saveRates, addInitialCost, deleteInitialCost, syncHistoricalRates, renderReport,
    openDayExtraModal, saveDayExtra, openChecklist, addCheckItem,
    toggleCheckItem, deleteCheckItem, openDocumentsModal, saveDocument,
    deleteDocument, copyDocument, openSearchModal, performGlobalSearch,
    openMoveCopyModal, prepareMoveModal, confirmMoveCopy,
    openCitySearch, addLocation, removeLocation, fetchWeather,
    openFullDayRoute, calcInlineRoute, openGPSRoute,
    useMyLocation, initOriginAutocomplete, openRadarModal, scanRadar,
    fetchWikipediaData, handleWikiInput, selectWikiSuggestion, quickShowHistory, fetchAIFacts,
    generatePDF, generateDayPDF, generateCalendarPDF, generateVisitedKML, generateICS
});
 
// ✅ INICIALIZAÇÃO DA APLICAÇÃO
function init() {
    console.log("🚀 Magic Planner: Iniciando sistema...");
    initAuth(() => {
        try {
            loadData();
            // Inicializa o editor de texto se ele existir na página
            const editorEl = document.getElementById('attDescEditor');
            if (editorEl && typeof Quill !== 'undefined') {
                const quill = new Quill('#attDescEditor', { theme: 'snow' });
                setAttractionQuill(quill);
            }
            // Verifica se há uma viagem específica na URL ou carrega a Home
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