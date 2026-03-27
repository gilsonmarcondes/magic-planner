// --- ENTRY POINT (Bootstrap do Magic Planner) ---
// ✅ Importações principais com caminhos corrigidos para a pasta js/
import { loadData, saveData, appData, setAttractionQuill } from './store.js';
import { render, goTo, openTrip, openDay }   from './router.js';
import { exportDataAsJson, closeModals }     from './utils.js';
import { initAuth, loginUser, logoutUser }   from './auth.js';

// ✅ Importações das Views (Telas)
import { createTrip, editTripMetadata, deleteTrip, importData } from './views/home.js';
import { addDay, addBucketList, deleteDay, openTripModal, saveTrip } from './views/trip.js'; 
import { renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
         setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
         setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions }    from './views/day.js';

// ✅ Importações dos Modais
import { openAttractionModal, saveAttraction, addTempCost } from './modals/attraction.js';
import { openTransportModal, addRouteStep, calcTransportRoute, saveTransport, deleteTransport } from './modals/transport.js';
import { openHotelManager, saveHotel, editHotel, deleteHotel } from './modals/hotel.js';
import { openFinanceModal, switchFinanceTab, saveRates, addInitialCost, deleteInitialCost, syncHistoricalRates, renderReport } from './modals/finance.js';
import { openDayExtraModal, saveDayExtra, openChecklist, addCheckItem,
         toggleCheckItem, deleteCheckItem, openDocumentsModal, saveDocument,
         deleteDocument, copyDocument, openSearchModal, performGlobalSearch,
         openMoveCopyModal, prepareMoveModal, confirmMoveCopy }              from './modals/misc.js';

// ✅ Importações de Funcionalidades (Features)
import { openCitySearch, addLocation, removeLocation, fetchWeather,
         openFullDayRoute, calcInlineRoute, openGPSRoute,
         useMyLocation, initOriginAutocomplete, openRadarModal, scanRadar }  from './features/maps.js';
import { fetchWikipediaData, handleWikiInput, selectWikiSuggestion, quickShowHistory } from './features/wiki.js';
import { fetchAIFacts } from './features/ai.js';
import { generatePDF, generateDayPDF, generateCalendarPDF, generateVisitedKML, generateICS } from './features/export.js';

// --- 🛠️ EXPOSIÇÃO GLOBAL (Conectando o código aos botões do index.html) ---
Object.assign(window, {
    // Auth & Navegação
    loginUser, logoutUser, goTo, openTrip, openDay, render, closeModals,
    
    // Gestão de Viagens
    createTrip, editTripMetadata, deleteTrip, importData,
    openTripModal, saveTrip, 
    exportData: () => exportDataAsJson(appData),
    addDay, addBucketList, deleteDay,
    
    // Ações do Roteiro (Day View)
    renameDay, toggleVisited, deleteAttraction, sortAttractionsByPriority,
    setInlineMode, toggleRoutePanel, toggleTicketContent, toggleMarauderMap,
    setMarauderMap, deleteDayExtra, openBatchMoveCopy, toggleSelectAllAttractions,
    
    // Atrações e Transportes
    openAttractionModal, saveAttraction, addTempCost,
    openTransportModal, addRouteStep, calcTransportRoute, saveTransport, deleteTransport,
    
    // Hotéis e Finanças
    openHotelManager, saveHotel, editHotel, deleteHotel,
    openFinanceModal, switchFinanceTab, saveRates, addInitialCost, deleteInitialCost, syncHistoricalRates, renderReport,
    
    // Outros Modais (Checklist, Documentos, Busca)
    openDayExtraModal, saveDayExtra, openChecklist, addCheckItem,
    toggleCheckItem, deleteCheckItem, openDocumentsModal, saveDocument,
    deleteDocument, copyDocument, openSearchModal, performGlobalSearch,
    openMoveCopyModal, prepareMoveModal, confirmMoveCopy,
    
    // Mapas, Clima e IA
    openCitySearch, addLocation, removeLocation, fetchWeather,
    openFullDayRoute, calcInlineRoute, openGPSRoute,
    useMyLocation, initOriginAutocomplete, openRadarModal, scanRadar,
    fetchWikipediaData, handleWikiInput, selectWikiSuggestion, quickShowHistory, fetchAIFacts,
    
    // Exportação
    generatePDF, generateDayPDF, generateCalendarPDF, generateVisitedKML, generateICS
});
 
// --- 🚀 INICIALIZAÇÃO DO SISTEMA ---
function init() {
    console.log("🚀 Magic Planner: Iniciando motor principal...");
    initAuth(() => {
        try {
            loadData();
            
            // Inicializa o Editor de Texto (Quill) se o elemento existir
            const editorEl = document.getElementById('attDescEditor');
            if (editorEl && typeof Quill !== 'undefined') {
                const quill = new Quill('#attDescEditor', { theme: 'snow' });
                setAttractionQuill(quill);
            }
            
            // Verifica se há uma viagem específica na URL ou abre a Home
            const params = new URLSearchParams(window.location.search);
            const urlTrip = params.get('tripId');
            if (urlTrip) goTo('trip', urlTrip); else render();
            
        } catch (e) { 
            console.error('❌ Erro crítico na inicialização:', e); 
            render(); 
        }
    });
}

// Aguarda o HTML carregar para dar a partida
document.addEventListener('DOMContentLoaded', init);