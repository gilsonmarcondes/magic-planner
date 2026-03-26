// --- ENTRY POINT ---
// Importa tudo e expõe globalmente (necessário para onclick no HTML)
import { loadData, saveData, appData, setAttractionQuill } from './store.js';
import { render, goTo, openTrip, openDay }   from './router.js';
import { exportDataAsJson, closeModals }     from './utils.js';

// Views
import { createTrip, editTripMetadata, deleteTrip, importData } from './views/home.js';
import { addDay, addBucketList, deleteDay }                     from './views/trip.js';
import { renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
         setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
         setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions }    from './views/day.js';

// Modals
import { openAttractionModal, saveAttraction, addTempCost, removeTempCost } from './modals/attraction.js';
import { openTransportModal, addRouteStep, removeRouteStep,
         handleRouteStepChange, saveRoute, deleteTransport }                 from './modals/transport.js';
import { openHotelManager, saveHotel, editHotel, deleteHotel,
         cancelEditHotel, toggleHotelPayDate }                               from './modals/hotel.js';
import { openFinanceModal, switchFinanceTab, saveRates,
         addInitialCost, deleteInitialCost }                                 from './modals/finance.js';
import { openDayExtraModal, saveDayExtra, openChecklist, addCheckItem,
         toggleCheckItem, deleteCheckItem, openDocumentsModal, saveDocument,
         deleteDocument, copyDocument, openSearchModal, performGlobalSearch,
         openMoveCopyModal, prepareMoveModal, confirmMoveCopy }              from './modals/misc.js';

// Features
import { openCitySearch, addLocation, removeLocation, fetchWeather,
         openFullDayRoute, openRadarModal, scanRadar, calcInlineRoute,
         openGPSRoute, useMyLocation, initOriginAutocomplete }               from './features/maps.js';
import { fetchWikipediaData, handleWikiInput, quickShowHistory }             from './features/wiki.js';
import { fetchAIFacts }                                                      from './features/ai.js';
import { generatePDF, generateDayPDF, generateCalendarPDF, generateVisitedKML, generateICS } from './features/export.js';

// --- EXPORTE PARA O ESCOPO GLOBAL ---
Object.assign(window, {
    // Roteador / Utilitários
    goTo, render, openTrip, openDay, closeModals, exportData: exportDataAsJson,
    
    // Views: Home & Trip
    createTrip, editTripMetadata, deleteTrip, importData, addDay, addBucketList, deleteDay,
    
    // Views: Day
    renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
    setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
    setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions,
    
    // Modals
    openAttractionModal, saveAttraction, addTempCost, removeTempCost,
    openTransportModal, addRouteStep, removeRouteStep, handleRouteStepChange, saveRoute, deleteTransport,
    openHotelManager, saveHotel, editHotel, deleteHotel, cancelEditHotel, toggleHotelPayDate,
    openFinanceModal, switchFinanceTab, saveRates, addInitialCost, deleteInitialCost,
    openDayExtraModal, saveDayExtra, openChecklist, addCheckItem, toggleCheckItem, deleteCheckItem,
    openDocumentsModal, saveDocument, deleteDocument, copyDocument,
    openSearchModal, performGlobalSearch, openMoveCopyModal, prepareMoveModal, confirmMoveCopy,
    
    // Features: Maps & Weather
    openCitySearch, addLocation, removeLocation, fetchWeather,
    openFullDayRoute, openRadarModal, scanRadar, calcInlineRoute,
    openGPSRoute, useMyLocation, initOriginAutocomplete,
    
    // Features: Wiki & AI
    fetchWikipediaData, handleWikiInput, quickShowHistory, fetchAIFacts,
    
    // Features: Export
    generatePDF, generateDayPDF, generateCalendarPDF, generateVisitedKML, generateICS,
});
 
// --- INICIALIZAÇÃO ---
function init() {
    try {
        loadData();

        // Inicializa o Quill
        if (document.getElementById('attDescEditor')) {
            const toolbarOptions = [
                [{ size: ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline'],
                [{ color: [] }, { background: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'clean'],
            ];
            const quill = new Quill('#attDescEditor', { modules: { toolbar: toolbarOptions }, theme: 'snow' });
            setAttractionQuill(quill);
        }

        // Navegação via URL params (deep link)
        const params   = new URLSearchParams(window.location.search);
        const urlTrip  = params.get('tripId');
        const urlDay   = params.get('dayId');
        const urlAtt   = params.get('attId');

        if (urlTrip && urlDay) {
            goTo('day', urlTrip, urlDay);
            if (urlAtt) setTimeout(() => { document.getElementById(`attraction-${urlAtt}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); openAttractionModal(urlAtt); }, 500);
        } else if (urlTrip) {
            goTo('trip', urlTrip);
        } else {
            render();
        }

    } catch (e) { console.error('Erro ao inicializar:', e); render(); }
}

document.addEventListener('DOMContentLoaded', init);