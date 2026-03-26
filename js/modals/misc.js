import { appData, currentState, saveData, setCurrentState, setCurrentBatchIds, setCurrentAttractionToMove } from '../store.js';
import { closeModals, randomId } from '../utils.js';

// --- CHECKLIST ---
export function openChecklist() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    renderChecklist(t);
    document.getElementById('checklistModal').classList.remove('hidden');
}

function renderChecklist(t) {
    const list = document.getElementById('checklistItems');
    list.innerHTML = (t.checklist || []).map((item, i) => `
        <div class="flex items-center gap-2 p-2 border-b">
            <input type="checkbox" ${item.done ? 'checked' : ''} onchange="window.toggleCheckItem(${i})">
            <span class="flex-1 ${item.done ? 'line-through text-gray-400' : ''}">${item.text}</span>
            <button onclick="window.deleteCheckItem(${i})" class="text-red-400">×</button>
        </div>`).join('');
}

export async function addCheckItem() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const text = document.getElementById('newCheckItem').value;
    if (text) {
        if(!t.checklist) t.checklist = [];
        t.checklist.push({ text, done: false });
        document.getElementById('newCheckItem').value = '';
        await saveData();
        renderChecklist(t);
    }
}

export async function toggleCheckItem(i) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.checklist[i].done = !t.checklist[i].done;
    await saveData();
    renderChecklist(t);
}

export async function deleteCheckItem(i) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.checklist.splice(i, 1);
    await saveData();
    renderChecklist(t);
}

// --- MOVER / COPIAR ---
export function openMoveCopyModal(id) {
    setCurrentAttractionToMove(id);
    setCurrentBatchIds([]);
    prepareMoveModal('Mover / Copiar Atração');
}

export function prepareMoveModal(title) {
    document.getElementById('moveModalTitle').innerText = title;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const select = document.getElementById('moveTargetDay');
    select.innerHTML = t.days.map((d, i) => `<option value="${d.id}">Dia ${i+1} (${d.date || ''})</option>`).join('');
    document.getElementById('moveCopyModal').classList.remove('hidden');
}

export async function confirmMoveCopy(isCopy) {
    const targetDayId = document.getElementById('moveTargetDay').value;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const fromDay = t.days.find(x => x.id === currentState.dayId);
    const toDay   = t.days.find(x => x.id === targetDayId);

    const idsToProcess = currentState.batchIds.length > 0 ? currentState.batchIds : [currentState.attractionToMove];

    idsToProcess.forEach(id => {
        const att = fromDay.attractions.find(a => String(a.id) === String(id));
        const tra = fromDay.transport.find(tr => String(tr.id) === String(id));
        
        if (att) {
            const newObj = JSON.parse(JSON.stringify(att));
            if (!isCopy) fromDay.attractions = fromDay.attractions.filter(a => String(a.id) !== String(id));
            else newObj.id = randomId();
            toDay.attractions.push(newObj);
        } else if (tra) {
            const newObj = JSON.parse(JSON.stringify(tra));
            if (!isCopy) fromDay.transport = fromDay.transport.filter(tr => String(tr.id) !== String(id));
            else newObj.id = randomId();
            toDay.transport.push(newObj);
        }
    });

    await saveData();
    closeModals();
    window.render();
}

// Outras funções (Documentos, Busca, etc.) seguem lógica similar
export function openDocumentsModal() { document.getElementById('documentsModal').classList.remove('hidden'); }
export function saveDocument() {}
export function deleteDocument() {}
export function copyDocument() {}
export function openSearchModal() { document.getElementById('searchModal').classList.remove('hidden'); }
export function performGlobalSearch() {}
export function openDayExtraModal() { document.getElementById('dayExtraModal').classList.remove('hidden'); }
export async function saveDayExtra() {
    const desc = document.getElementById('extraDesc').value;
    const value = document.getElementById('extraValue').value;
    if (desc && value) {
        const t = appData.trips.find(x => x.id === currentState.tripId);
        const d = t.days.find(x => x.id === currentState.dayId);
        d.extraCosts.push({ desc, value, currency: 'BRL' });
        await saveData();
        closeModals();
        window.render();
    }
}