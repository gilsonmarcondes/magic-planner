import { loadData, saveData, appData, setAttractionQuill } from './store.js';
import { render, goTo, openTrip, openDay }   from './router.js';
import { exportDataAsJson, closeModals }     from './utils.js';
import { initAuth, loginUser, logoutUser } from './auth.js';

// Views
import { createTrip, editTripMetadata, deleteTrip, importData } from './views/home.js';
// 👇 AQUI ESTÁ A MÁGICA: Removidos os imports problemáticos
import { openTripModal, saveTrip } from './views/trip.js'; 
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

// Exposição Global
Object.assign(window, {
    loginUser, logoutUser, goTo, openTrip, openDay, render, closeModals,
    createTrip, editTripMetadata, deleteTrip, importData,
    openTripModal, saveTrip, 
    exportData: () => exportDataAsJson(appData),
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
 
function init() {
    console.log("🚀 Sistema: Iniciando motor principal...");
    initAuth(() => {
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