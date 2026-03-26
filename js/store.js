// --- GERENCIAMENTO DE ESTADO E DADOS (NUVEM FIREBASE) ---
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from './firebase.js';
import { currentUser } from './auth.js';
import { STORAGE_KEY } from './config.js';

// --- VARIÁVEIS DO APLICATIVO ---
export const appData = { trips: [] };

export const currentState = {
    page: 'home',
    tripId: null,
    dayId: null,
    batchIds: [],
    attractionToMove: null
};

export let currentInlineModes = {};
let attractionQuillInstance = null;

// --- 📈 VARIÁVEIS DOS GRÁFICOS (O QUE ESTAVA FALTANDO!) ---
export let myFinanceChart = null;
export let myMonthlyChart = null;

// --- FUNÇÕES DE ATUALIZAÇÃO ---
export function setCurrentState(newState) { Object.assign(currentState, newState); }
export function setCurrentInlineModes(modes) { currentInlineModes = modes; }
export function setAppData(newData) { appData.trips = newData.trips || []; }

export function setAttractionQuill(q) { attractionQuillInstance = q; }
export function getAttractionQuill() { return attractionQuillInstance; }

export function setCurrentBatchIds(ids) { currentState.batchIds = ids; }
export function setCurrentAttractionToMove(id) { currentState.attractionToMove = id; }

// --- FUNÇÕES DOS GRÁFICOS (NECESSÁRIAS PARA O FINANCE.JS) ---
export function setMyFinanceChart(val) { myFinanceChart = val; }
export function setMyMonthlyChart(val) { myMonthlyChart = val; }

// --- ☁️ FUNÇÕES DE NUVEM ---

export async function loadData() {
    if (!currentUser) return;
    try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            appData.trips = data.trips || [];
        } else {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (localData) {
                console.log("Migrando dados locais...");
                const parsed = JSON.parse(localData);
                appData.trips = parsed.trips || [];
                await saveData(); 
                alert("✨ Mágica feita! Seus roteiros foram migrados para a nuvem!");
            }
        }
        if (window.render) window.render();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

export async function saveData() {
    if (!currentUser) return;
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
        indicator.innerText = '⏳ Salvando...';
        indicator.classList.remove('opacity-0');
        indicator.classList.replace('bg-green-500', 'bg-blue-500');
    }
    try {
        const docRef = doc(db, "users", currentUser.uid);
        await setDoc(docRef, { trips: appData.trips });
        if (indicator) {
            indicator.innerText = '☁️ Salvo';
            indicator.classList.replace('bg-blue-500', 'bg-green-500');
            setTimeout(() => indicator.classList.add('opacity-0'), 2000);
        }
    } catch (error) {
        console.error("Erro ao salvar:", error);
        if (indicator) {
            indicator.innerText = '❌ Erro';
            indicator.classList.replace('bg-blue-500', 'bg-red-500');
        }
    }
}