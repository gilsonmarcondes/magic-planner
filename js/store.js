// --- ESTADO GLOBAL E PERSISTÊNCIA ---
import { STORAGE_KEY, STORAGE_KEY_LEGACY } from './config.js';

export let appData = { trips: [] };

export let currentState = { page: 'home', tripId: null, dayId: null };

// Variáveis de edição temporária compartilhadas entre modais
export let currentEditingId = null;
export let tempAttractionCosts = [];
export let tempRouteSteps = [];
export let currentEditingTicketId = null;
export let currentEditingHotelId = null;
export let currentInlineModes = {};
export let currentAttractionToMove = null;
export let currentBatchIds = [];
export let currentAttractionPlace = null;
export let attractionQuill = null;
export let cityAutocomplete = null;
export let myFinanceChart = null;
export let myMonthlyChart = null;
export let wikiDebounce = null;

// Setters para variáveis mutáveis exportadas
export function setAppData(data) { appData = data; }
export function setCurrentState(updates) { Object.assign(currentState, updates); }
export function setCurrentEditingId(id) { currentEditingId = id; }
export function setTempAttractionCosts(arr) { tempAttractionCosts = arr; }
export function setTempRouteSteps(arr) { tempRouteSteps = arr; }
export function setCurrentEditingTicketId(id) { currentEditingTicketId = id; }
export function setCurrentEditingHotelId(id) { currentEditingHotelId = id; }
export function setCurrentInlineModes(obj) { currentInlineModes = obj; }
export function setCurrentAttractionToMove(id) { currentAttractionToMove = id; }
export function setCurrentBatchIds(arr) { currentBatchIds = arr; }
export function setCurrentAttractionPlace(place) { currentAttractionPlace = place; }
export function setAttractionQuill(quill) { attractionQuill = quill; }
export function setCityAutocomplete(ac) { cityAutocomplete = ac; }
export function setMyFinanceChart(chart) { myFinanceChart = chart; }
export function setMyMonthlyChart(chart) { myMonthlyChart = chart; }
export function setWikiDebounce(t) { wikiDebounce = t; }

// --- NORMALIZAÇÃO DOS DADOS (migração de versões antigas) ---
export function normalizeData(data) {
    if (!data.trips) data.trips = [];

    data.trips.forEach(t => {
        if (!t.initialCosts) t.initialCosts = [];
        if (!t.checklist)    t.checklist = [];
        if (!t.hotels)       t.hotels = [];
        if (!t.rates)        t.rates = { USD: 0, EUR: 0, GBP: 0 };
        if (!t.coverPhoto)   t.coverPhoto = '';
        if (!t.documents)    t.documents = [];
        if (!t.days)         t.days = [];

        t.days.forEach(d => {
            if (!d.locations)              d.locations = [];
            if (!d.attractions)            d.attractions = [];
            if (!d.transport)              d.transport = [];
            if (!d.extraCosts)             d.extraCosts = [];
            if (typeof d.journal !== 'string') d.journal = '';
            if (!d.mapUrl)                 d.mapUrl = '';
            if (!d.subtitle)               d.subtitle = '';

            d.attractions.forEach(a => {
                if (!a.costs)      a.costs = [];
                if (!a.photos)     a.photos = a.photo ? [a.photo] : [];
                if (!a.type)       a.type = 'other';
                if (!a.priority)   a.priority = 'standard';
                if (!a.mapNumber)  a.mapNumber = '';
                if (!a.subtitle)   a.subtitle = '';
                a.costs.forEach(c => {
                    if (c.paid === undefined)    c.paid = false;
                    if (c.payDate === undefined) c.payDate = '';
                });
            });

            d.transport.forEach(tr => { if (!tr.steps) tr.steps = []; });
        });
    });

    return data;
}

// --- SALVAMENTO BLINDADO ---
function showSaveStatus() {
    const el = document.getElementById('autoSaveIndicator');
    if (el) {
        el.classList.remove('opacity-0');
        setTimeout(() => el.classList.add('opacity-0'), 2000);
    }
}

// Adicionamos o parâmetro "silent" para não piscar a notificação a cada 10s
export function saveData(silent = false) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        if (!silent) showSaveStatus();
    } catch (e) {
        console.error("Erro ao salvar:", e);
        if (e.name === 'QuotaExceededError') {
            alert("⚠️ Atenção: O armazenamento do navegador está cheio! Remova algumas fotos do diário ou do checklist para voltar a salvar.");
        }
    }
}

// --- CARREGAMENTO ---
export function loadData() {
    const json = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY_LEGACY);
    if (json) {
        const parsed = JSON.parse(json);
        setAppData(normalizeData(parsed));
    }
}

// Auto-save a cada 10 segundos (agora é silencioso!)
setInterval(() => saveData(true), 10_000);

