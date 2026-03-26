// --- MODAL: ATRAÇÃO ---
import { appData, currentState, currentAttractionPlace, tempAttractionCosts, attractionQuill,
         saveData, setCurrentEditingId, setTempAttractionCosts, setCurrentAttractionPlace,
         setAttractionQuill, currentEditingId } from '../store.js';
import { formatDateBr, closeModals } from '../utils.js';

import { GOOGLE_API_KEY } from '../config.js';

// Função auxiliar para evitar erros de "null" se o ID não existir no HTML
const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
};

export function openAttractionModal(attractionId = null) {
    try {
        setCurrentEditingId(attractionId);
        setCurrentAttractionPlace(null);
        setTempAttractionCosts([]);

        // Limpar campos de forma segura
        ['attName', 'attMapNum', 'attSubtitle', 'attHours', 'attAddress', 'attPhotos'].forEach(id => {
            setVal(id, '');
        });
        
        const typeEl     = document.getElementById('attType');     if (typeEl)     typeEl.value     = 'sight';
        const priorityEl = document.getElementById('attPriority'); if (priorityEl) priorityEl.value = 'standard';

        const quill = attractionQuill;
        if (quill) quill.root.innerHTML = '';

        // Preenche se for edição
        if (attractionId) {
            const trip = appData.trips.find(x => x.id === currentState.tripId);
            const day  = trip?.days.find(x => x.id === currentState.dayId);
            const att  = day?.attractions.find(x => String(x.id) === String(attractionId));

            if (att) {
                setVal('attName',     att.name);
                setVal('attMapNum',   att.mapNumber);
                setVal('attSubtitle', att.subtitle);
                setVal('attType',     att.type);
                setVal('attPriority', att.priority);
                setVal('attHours',    att.hours); // <--- Aqui era o erro!
                setVal('attAddress',  att.address);
                setVal('attPhotos',   (att.photos?.length ? att.photos : att.photo ? [att.photo] : []).join('\n'));
                
                if (quill) quill.root.innerHTML = att.description || '';
                setCurrentAttractionPlace({ address: att.address, lat: att.latitude, lng: att.longitude });
                setTempAttractionCosts(JSON.parse(JSON.stringify(att.costs || [])));
            }
        }

        renderTempCosts();
        try { if (typeof google !== 'undefined' && google.maps?.places) initAttractionAutocomplete(); } catch {}
        document.getElementById('attractionModal').classList.add('active');
    } catch (err) { console.error('ERRO MODAL:', err); }
}

export async function saveAttraction() {
    const nameInput = document.getElementById('attName');
    if (!nameInput?.value) return alert('Por favor, preencha o nome.');

    const btnSave   = document.querySelector('#attractionModal .btn-primary');
    const oldText   = btnSave?.innerText || 'Salvar';
    if (btnSave) { btnSave.innerText = '💾 Salvando...'; btnSave.disabled = true; }

    try {
        const getVal = id => document.getElementById(id)?.value || '';
        const name        = getVal('attName');
        const mapNum      = getVal('attMapNum');
        const subtitle    = getVal('attSubtitle');
        const type        = getVal('attType')     || 'other';
        const priority    = getVal('attPriority') || 'standard';
        const hours       = getVal('attHours');
        const address     = getVal('attAddress');
        const photosText  = getVal('attPhotos');
        const photosArray = photosText.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 5);
        const description = attractionQuill?.root?.innerHTML || '';

        let lat = currentAttractionPlace?.lat;
        let lng = currentAttractionPlace?.lng;
        let finalAddress = address;

        if ((!lat || !lng) && address.length > 3 && window.google) {
            try {
                await new Promise(resolve => {
                    new google.maps.Geocoder().geocode({ address }, (results, status) => {
                        if (status === 'OK' && results[0]) {
                            lat          = results[0].geometry.location.lat();
                            lng          = results[0].geometry.location.lng();
                            finalAddress = results[0].formatted_address;
                        }
                        resolve();
                    });
                });
            } catch {}
        }

        const trip = appData.trips.find(t => t.id === currentState.tripId);
        const day  = trip.days.find(d => d.id === currentState.dayId);

        const newData = {
            id:        currentEditingId || Date.now(),
            name, mapNumber: mapNum, subtitle, type, priority, hours,
            address:   finalAddress,
            photos:    photosArray,
            photo:     photosArray[0] || '',
            description,
            latitude:  lat,
            longitude: lng,
            visited:   false,
            costs:     [...tempAttractionCosts],
        };

        if (currentEditingId) {
            const idx = day.attractions.findIndex(a => String(a.id) === String(currentEditingId));
            if (idx !== -1) { newData.visited = day.attractions[idx].visited; day.attractions[idx] = newData; }
        } else {
            day.attractions.push(newData);
        }

        saveData(); closeModals(); window.render();
    } catch (err) {
        console.error('Erro ao salvar atração:', err);
        alert('Ocorreu um erro ao salvar.');
    } finally {
        if (btnSave) { btnSave.innerText = oldText; btnSave.disabled = false; }
    }
}

export function addTempCost() {
    const nameEl = document.getElementById('newCostName');
    const valEl  = document.getElementById('newCostVal');
    const currEl = document.getElementById('newCostCurr');
    const qtyEl  = document.getElementById('newCostQty');

    const n = nameEl?.value.trim(); if (!n) return;
    const v = parseFloat(valEl?.value.replace(',', '.')) || 0;
    const q = parseFloat(qtyEl?.value) || 1;

    tempAttractionCosts.push({ 
        name: q > 1 ? `${n} (x${q})` : n, 
        value: v * q, 
        currency: currEl?.value || 'BRL', 
        paid: false, 
        payDate: '' 
    });
    renderTempCosts();
    if(nameEl) nameEl.value = ''; 
    if(valEl) valEl.value = '';
}

export function removeTempCost(i) { tempAttractionCosts.splice(i, 1); renderTempCosts(); }

function renderTempCosts() {
    const list = document.getElementById('attCostsList');
    if (!list) return;
    list.innerHTML = tempAttractionCosts.map((c, i) => `
        <li class="flex justify-between items-center text-sm p-2 bg-white rounded border my-1">
            <span class="font-bold">${c.name}</span>
            <div class="flex items-center gap-2">
                <span class="text-xs font-bold">${c.currency} ${parseFloat(c.value).toFixed(2)}</span>
                <button onclick="window.removeTempCost(${i})" class="text-red-400 font-bold">×</button>
            </div>
        </li>`).join('');
}

function initAttractionAutocomplete() {
    const input = document.getElementById('attAddress');
    if (!input || !window.google || window.attractionAutocomplete) return;
    try {
        window.attractionAutocomplete = new google.maps.places.Autocomplete(input);
        window.attractionAutocomplete.addListener('place_changed', () => {
            const place = window.attractionAutocomplete.getPlace();
            if (!place.geometry) return;
            setCurrentAttractionPlace({ address: place.formatted_address, lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
            const nameInput = document.getElementById('attName');
            if (nameInput && !nameInput.value) nameInput.value = place.name;
        });
    } catch (e) { console.error('Autocomplete erro:', e); }
}