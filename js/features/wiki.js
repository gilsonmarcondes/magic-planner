// --- FEATURE: WIKIPEDIA ---
import { appData, currentState, wikiDebounce, attractionQuill, saveData, setWikiDebounce } from '../store.js';


async function searchWiki(term, lang = 'pt') {
    const base = `https://${lang}.wikipedia.org`;
    const res  = await fetch(`${base}/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=5&namespace=0&format=json&origin=*`);
    const data = await res.json();
    return { titles: data[1] || [], base };
}

async function getWikiSummary(title, lang = 'pt') {
    const base = `https://${lang}.wikipedia.org`;
    
    // Usando a API de Extracts para pegar um texto muito maior (até 12 frases completas)
    const url = `${base}/w/api.php?action=query&prop=extracts&exsentences=12&explaintext=1&format=json&origin=*&titles=${encodeURIComponent(title)}`;
    
    const res  = await fetch(url);
    if (!res.ok) throw new Error();
    
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    // Se a página não tiver conteúdo, lança erro
    if (pageId === "-1" || !pages[pageId].extract) throw new Error();

    // Quebra o texto em parágrafos reais para não ficar um bloco gigante e feio de ler
    let formattedExtract = pages[pageId].extract.replace(/\n/g, '<br><br>');

    return { 
        data: { extract: formattedExtract }, 
        wikiUrl: `${base}/wiki/${encodeURIComponent(title)}` 
    };
}

export async function fetchWikipediaData() {
    const nameInput = document.getElementById('attName');
    const term      = nameInput?.value; if (!term) return alert('Digite o nome da atração primeiro!');

    const btn     = document.querySelector('button[title="Buscar História"]');
    const oldText = btn?.innerText || '';
    if (btn) { btn.innerHTML = '⏳ ...'; btn.disabled = true; }

    try {
        let foundTitle = null, lang = 'pt', wikiBase = 'https://pt.wikipedia.org';
        const ptResult = await searchWiki(term, 'pt');
        if (ptResult.titles.length > 0) { foundTitle = ptResult.titles[0]; }
        else {
            const enResult = await searchWiki(term, 'en');
            if (enResult.titles.length > 0) { foundTitle = enResult.titles[0]; lang = 'en'; wikiBase = 'https://en.wikipedia.org'; }
        }
        if (!foundTitle) throw new Error('Não encontrado.');

        const { data, wikiUrl } = await getWikiSummary(foundTitle, lang);
        const langBadge = lang === 'en' ? ' <small>(Texto em Inglês)</small>' : '';
        const historyText = `<br><div style="background-color:#f9fafb;padding:10px;border-left:4px solid #3b82f6;margin-top:10px;font-size:0.9em;color:#374151;">
            <strong style="color:#1e3a8a">🏛️ História: ${foundTitle}</strong>${langBadge}
            <p style="margin-top:5px">${data.extract}</p>
            <p style="margin-top:5px;font-size:0.8em"><a href="${wikiUrl}" target="_blank" style="color:#2563eb;text-decoration:underline">Ler completo na Wikipedia</a></p>
        </div><br>`;

        if (attractionQuill) attractionQuill.root.innerHTML += historyText;
        else alert(data.extract);
    } catch {
        alert(`Não encontramos nada sobre "${term}". Tente apenas o nome principal.`);
    } finally {
        if (btn) { btn.innerText = oldText; btn.disabled = false; }
    }
}

export async function handleWikiInput(text) {
    const list = document.getElementById('wikiSuggestions');
    if (!text || text.length < 3) { list?.classList.add('hidden'); if (list) list.innerHTML = ''; return; }

    clearTimeout(wikiDebounce);
    setWikiDebounce(setTimeout(async () => {
        try {
            const { titles } = await searchWiki(text, 'pt');
            if (!list) return;
            if (titles.length > 0) {
                list.innerHTML = titles.map(s => `<li onclick="window.selectWikiSuggestion('${s.replace(/'/g, "\\'")}')" class="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 text-gray-700 font-medium transition-colors">🔍 ${s}</li>`).join('');
                list.classList.remove('hidden');
            } else { list.classList.add('hidden'); }
        } catch {}
    }, 300));
}

export function selectWikiSuggestion(name) {
    const input = document.getElementById('attName');
    const list  = document.getElementById('wikiSuggestions');
    if (input) input.value = name;
    if (list)  { list.classList.add('hidden'); list.innerHTML = ''; }
    fetchWikipediaData();
}

export async function quickShowHistory(attractionId) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    const a = d.attractions.find(x => String(x.id) === String(attractionId));
    if (!a) return;

    if (a.description?.includes('História:')) {
        const clean = a.description.replace(/<[^>]*>?/gm, '\n').replace(/&nbsp;/g, ' ');
        alert('📖 HISTÓRIA SALVA:\n' + clean.substring(0, 800) + '...');
        return;
    }

    const btn     = document.querySelector(`div[data-id="${attractionId}"] button[title="Ler História"]`) || document.querySelector(`#attraction-${attractionId} .btn`);
    const oldText = btn?.innerText || '';
    if (btn) btn.innerText = '⏳...';

    try {
        let foundTitle = null, lang = 'pt';
        const pt = await searchWiki(a.name, 'pt');
        if (pt.titles.length > 0) { foundTitle = pt.titles[0]; }
        else { const en = await searchWiki(a.name, 'en'); if (en.titles.length > 0) { foundTitle = en.titles[0]; lang = 'en'; } }
        if (!foundTitle) throw new Error();

        const { data } = await getWikiSummary(foundTitle, lang);
        a.description = (a.description || '') + `<br><strong>🏛️ História (${foundTitle}):</strong><br>${data.extract}`;
        saveData(); window.render();
        alert(`📖 HISTÓRIA ENCONTRADA:\n\n${data.extract}`);
    } catch {
        alert('Não encontramos história para este local. Tente editar e ajustar o nome.');
    } finally {
        if (btn) btn.innerText = oldText;
    }
}

// Fecha sugestões ao clicar fora
document.addEventListener('click', e => {
    const list  = document.getElementById('wikiSuggestions');
    const input = document.getElementById('attName');
    if (list && !list.contains(e.target) && e.target !== input) list.classList.add('hidden');
});
