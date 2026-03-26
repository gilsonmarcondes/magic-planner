// --- FEATURE: WIKIPEDIA ---
import { appData, currentState, getAttractionQuill } from '../store.js';

export async function fetchWikipediaData(searchTerm) {
    const url = `https://pt.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro&explaintext&titles=${encodeURIComponent(searchTerm)}&origin=*&pithumbsize=400`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId === "-1") return null;
        return {
            extract: pages[pageId].extract,
            image: pages[pageId].thumbnail ? pages[pageId].thumbnail.source : null
        };
    } catch (e) { return null; }
}

export function handleWikiInput(e) {
    // Função para lidar com a digitação na busca da Wiki
    console.log("Buscando na Wiki:", e.target.value);
}

// ESTA É A FUNÇÃO QUE ESTAVA FALTANDO:
export function selectWikiSuggestion(term) {
    console.log("Sugestão selecionada:", term);
}

export async function quickShowHistory(id) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = d.attractions.find(x => String(x.id) === String(id));
    
    const info = await fetchWikipediaData(a.name);
    if (info) {
        const quill = getAttractionQuill();
        if (quill) {
            const currentContent = quill.root.innerHTML;
            quill.root.innerHTML = currentContent + `<hr><p><b>História (Wikipedia):</b> ${info.extract}</p>`;
            alert('História adicionada à descrição!');
        }
    } else {
        alert('Não encontrei informações históricas para este local.');
    }
}