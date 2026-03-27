import { loadData, saveData, appData, setAttractionQuill } from './store.js';
import { render, goTo, openTrip, openDay }   from './router.js';
import { exportDataAsJson, closeModals }     from './utils.js';
import { initAuth, loginUser, logoutUser } from './auth.js';

// Tudo que for de Home e do Modal de Viagem sai daqui!
import { deleteTrip, importData, openTripModal, saveTrip } from './views/home.js';
import { addDay, addBucketList, deleteDay } from './views/trip.js'; 
import { renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
         setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
         setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions }    from './views/day.js';

import { openAttractionModal, saveAttraction, addTempCost } from './modals/attraction.js';
import { openTransportModal, addRouteStep, calcTransportRoute, saveTransport, deleteTransport } from './modals/transport.js';
import { openHotelManager, saveHotel, editHotel, deleteHotel } from './modals/hotel.js';
import { openFinanceModal, switchFinanceTab, saveRates, addInitialCost, deleteInitialCost, syncHistoricalRates, renderReport } from './modals/finance.js';
import { openDayExtraModal, saveDayExtra, openChecklist, addCheckItem,
         toggleCheckItem, deleteCheckItem, openDocumentsModal, saveDocument,
         deleteDocument, copyDocument, openSearchModal, performGlobalSearch,
         openMoveCopyModal, prepareMoveModal, confirmMoveCopy }              from './modals/misc.js';

import { openCitySearch, addLocation, removeLocation, fetchWeather,
         openFullDayRoute, calcInlineRoute, openGPSRoute,
         useMyLocation, initOriginAutocomplete, openRadarModal, scanRadar }  from './features/maps.js';
import { fetchWikipediaData, handleWikiInput, selectWikiSuggestion, quickShowHistory } from './features/wiki.js';
import { fetchAIFacts } from './features/ai.js';
import { generatePDF, generateDayPDF, generateCalendarPDF, generateVisitedKML, generateICS } from './features/export.js';

Object.assign(window, {
    loginUser, logoutUser, goTo, openTrip, openDay, render, closeModals,
    deleteTrip, importData, openTripModal, saveTrip, 
    exportData: () => exportDataAsJson(appData),
    addDay, addBucketList, deleteDay, renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
    setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
    setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions,
    openAttractionModal, saveAttraction, addTempCost, openTransportModal, addRouteStep, calcTransportRoute, saveTransport, deleteTransport,
    openHotelManager, saveHotel, editHotel, deleteHotel, openFinanceModal, switchFinanceTab, saveRates, addInitialCost, deleteInitialCost, syncHistoricalRates, renderReport,
    openDayExtraModal, saveDayExtra, openChecklist, addCheckItem, toggleCheckItem, deleteCheckItem, openDocumentsModal, saveDocument, deleteDocument, copyDocument, openSearchModal, performGlobalSearch,
    openMoveCopyModal, prepareMoveModal, confirmMoveCopy, openCitySearch, addLocation, removeLocation, fetchWeather, openFullDayRoute, calcInlineRoute, openGPSRoute, useMyLocation, initOriginAutocomplete, openRadarModal, scanRadar,
    fetchWikipediaData, handleWikiInput, selectWikiSuggestion, quickShowHistory, fetchAIFacts, generatePDF, generateDayPDF, generateCalendarPDF, generateVisitedKML, generateICS
});
 
function init() {
    initAuth(() => {
        try {
            loadData();
            const params = new URLSearchParams(window.location.search);
            const urlTrip = params.get('tripId');
            if (urlTrip) goTo('trip', urlTrip); else render();
        } catch (e) { render(); }
    });
}
document.addEventListener('DOMContentLoaded', init);