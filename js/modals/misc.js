// --- MODAIS: MISC (checklist, docs, extras, busca, mover/copiar) ---
import { appData, currentState, currentAttractionToMove, currentBatchIds, saveData,
         setCurrentAttractionToMove, setCurrentBatchIds } from '../store.js';
import { closeModals } from '../utils.js';

import { openAttractionModal } from './attraction.js';

// --- GASTOS EXTRAS ---
export function openDayExtraModal() {
    document.getElementById('extraDesc').value = '';
    document.getElementById('extraVal').value  = '';
    document.getElementById('dayExtraModal').classList.add('active');
    setTimeout(() => document.getElementById('extraDesc').focus(), 100);
}

export function saveDayExtra() {
    const desc = document.getElementById('extraDesc').value;
    const val  = document.getElementById('extraVal').value;
    const curr = document.getElementById('extraCurr').value;
    if (!desc || !val) return alert('Preencha descrição e valor!');

    const trip = appData.trips.find(x => x.id === currentState.tripId);
    const day  = trip.days.find(x => x.id === currentState.dayId);
    day.extraCosts.push({ desc, value: val, currency: curr });
    saveData(); closeModals(); window.render();
}

// --- CHECKLIST ---
export function openChecklist() {
    const t    = appData.trips.find(x => x.id === currentState.tripId);
    const list = document.getElementById('checklistContainer'); if (!list) return;

    list.innerHTML = t.checklist.map((c, i) => `
        <li class="flex justify-between items-center p-2 bg-gray-50 border-b last:border-0">
            <label class="flex items-center gap-2 cursor-pointer w-full">
                <input type="checkbox" ${c.done ? 'checked' : ''} onchange="window.toggleCheckItem(${i})" class="accent-emerald-600 w-5 h-5">
                <span class="${c.done ? 'line-through text-gray-400' : 'text-gray-800'}">${c.text}</span>
            </label>
            <button onclick="window.deleteCheckItem(${i})" class="text-red-400 hover:text-red-600 px-2">×</button>
        </li>`).join('');

    document.getElementById('checklistModal').classList.add('active');
}

export function addCheckItem(e) {
    e.preventDefault();
    const val = document.getElementById('checkInput').value; if (!val) return;
    const t   = appData.trips.find(x => x.id === currentState.tripId);
    t.checklist.push({ text: val, done: false });
    saveData(); document.getElementById('checkInput').value = ''; openChecklist();
}

export function toggleCheckItem(i) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.checklist[i].done = !t.checklist[i].done;
    saveData(); openChecklist();
}

export function deleteCheckItem(i) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.checklist.splice(i, 1); saveData(); openChecklist();
}

// --- DOCUMENTOS ---
export function openDocumentsModal() {
    document.getElementById('docTitle').value   = '';
    document.getElementById('docContent').value = '';
    document.getElementById('documentsModal').classList.add('active');
    renderDocumentsList();
}

export function saveDocument() {
    const title   = document.getElementById('docTitle').value;
    const content = document.getElementById('docContent').value;
    if (!title || !content) return alert('Preencha título e conteúdo!');
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t.documents) t.documents = [];
    t.documents.push({ id: Date.now().toString(), title, content });
    saveData(); renderDocumentsList();
    document.getElementById('docTitle').value   = '';
    document.getElementById('docContent').value = '';
}

export function deleteDocument(id) {
    if (!confirm('Apagar documento?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.documents = t.documents.filter(d => d.id !== id);
    saveData(); renderDocumentsList();
}

export function copyDocument(text) {
    navigator.clipboard.writeText(text).then(() => alert('Copiado!')).catch(() => prompt('Copie:', text));
}

function renderDocumentsList() {
    const t    = appData.trips.find(x => x.id === currentState.tripId);
    const list = document.getElementById('documentsList');
    if (!t.documents) t.documents = [];
    list.innerHTML = t.documents.length === 0
        ? '<div class="text-center text-gray-400 italic py-4">Nenhum documento salvo.</div>'
        : t.documents.map(d => `
            <div class="bg-white border border-gray-200 rounded p-3 shadow-sm flex justify-between items-center mb-2">
                <div class="overflow-hidden mr-2 flex-1">
                    <div class="font-bold text-sm text-slate-700">${d.title}</div>
                    <div class="text-xs text-gray-500 font-mono bg-gray-50 p-1 rounded mt-1 truncate border select-all cursor-text">${d.content}</div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button onclick="window.copyDocument('${d.content}')"  class="text-blue-600 bg-blue-50 border p-2 rounded text-xs font-bold">📋</button>
                    <button onclick="window.deleteDocument('${d.id}')" class="text-gray-300 hover:text-red-500 p-2 font-bold">×</button>
                </div>
            </div>`).join('');
}

// --- BUSCA GLOBAL ---
export function openSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) { modal.classList.add('active'); setTimeout(() => document.getElementById('globalSearchInput')?.focus(), 100); }
}

export function performGlobalSearch() {
    const input   = document.getElementById('globalSearchInput');
    const results = document.getElementById('searchResults');
    if (!input || !results) return;

    const query = input.value.toLowerCase();
    results.innerHTML = '';
    if (query.length < 2) return;

    let found = false;
    appData.trips.forEach(trip => {
        trip.days.forEach((day, dayIndex) => {
            day.attractions.forEach(att => {
                if (att.name.toLowerCase().includes(query) || att.address?.toLowerCase().includes(query)) {
                    found = true;
                    const div = document.createElement('div');
                    div.className = 'p-2 border-b text-xs hover:bg-gray-100 cursor-pointer';
                    div.innerHTML = `<b>${att.name}</b><br><span class="text-gray-500">${trip.destination} - Dia ${dayIndex + 1}</span>`;
                    div.onclick = () => { closeModals(); window.goTo('day', trip.id, day.id); setTimeout(() => openAttractionModal(att.id), 300); };
                    results.appendChild(div);
                }
            });
        });
    });

    if (!found) results.innerHTML = '<p class="text-gray-400 text-xs text-center mt-4">Nada encontrado.</p>';
}

// --- MOVER / COPIAR ---
export function openMoveCopyModal(id) {
    setCurrentAttractionToMove(id);
    setCurrentBatchIds([]);
    prepareMoveModal('Mover ou Copiar Item');
}

export function prepareMoveModal(title) {
    const t   = appData.trips.find(x => x.id === currentState.tripId);
    const sel = document.getElementById('targetDaySelect');
    sel.innerHTML = '';
    t.days.forEach((d, i) => {
        const opt = document.createElement('option');
        opt.value    = d.id;
        const dateLabel = d.date ? new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Bucket List';
        opt.innerText = `${d.customTitle || 'Dia ' + (i + 1)} (${dateLabel})`;
        sel.appendChild(opt);
    });
    const h3 = document.querySelector('#moveCopyModal h3'); if (h3) h3.innerText = title;
    document.getElementById('moveCopyModal').classList.add('active');
}

export function confirmMoveCopy(action) {
    const t    = appData.trips.find(x => x.id === currentState.tripId);
    const sDay = t.days.find(x => x.id === currentState.dayId);
    const tDay = t.days.find(x => x.id === document.getElementById('targetDaySelect').value);
    if (!sDay || !tDay) return;
    if (action === 'move' && sDay.id === tDay.id) return alert('A origem e o destino são o mesmo dia!');

    const idsToProcess = currentBatchIds.length > 0 ? currentBatchIds : [currentAttractionToMove];
    idsToProcess.forEach(id => {
        const attIdx = sDay.attractions.findIndex(a => String(a.id) === String(id));
        const transIdx = sDay.transport.findIndex(tr => String(tr.id) === String(id));
        const isAtt = attIdx !== -1;
        const idx = isAtt ? attIdx : transIdx;
        if (idx === -1) return;

        const item = JSON.parse(JSON.stringify(isAtt ? sDay.attractions[idx] : sDay.transport[idx]));
        if (action === 'move') {
            if (isAtt) sDay.attractions.splice(idx, 1); else sDay.transport.splice(idx, 1);
        } else {
            item.id = Date.now() + Math.random().toString(36).substr(2, 5);
        }
        if (isAtt) tDay.attractions.push(item); else tDay.transport.push(item);
    });

    saveData(); closeModals(); window.render();
}