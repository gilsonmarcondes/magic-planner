// --- GERENCIAMENTO DE ESTADO E DADOS (NUVEM FIREBASE) ---
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from './firebase.js';
import { currentUser } from './auth.js';
import { STORAGE_KEY } from './config.js';

// Nossos dados do aplicativo
export const appData = { trips: [] };

// Estado da interface (onde o usuário está clicando)
export const currentState = {
    page: 'home',
    tripId: null,
    dayId: null,
    batchIds: [],
    attractionToMove: null
};

export let currentInlineModes = {};
let attractionQuillInstance = null;

export function setCurrentState(newState) { Object.assign(currentState, newState); }
export function setCurrentInlineModes(modes) { currentInlineModes = modes; }
export function setAppData(newData) { appData.trips = newData.trips || []; }

export function setAttractionQuill(q) { attractionQuillInstance = q; }
export function getAttractionQuill() { return attractionQuillInstance; }

export function setCurrentBatchIds(ids) { currentState.batchIds = ids; }
export function setCurrentAttractionToMove(id) { currentState.attractionToMove = id; }

// --- ☁️ FUNÇÕES DE NUVEM ---

export async function loadData() {
    // Se não tiver ninguém logado, não faz nada
    if (!currentUser) return;

    try {
        // 1. Aponta para o "cofre" exclusivo do usuário logado usando o ID único dele (uid)
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // 2. O cofre tem dados! Puxa da nuvem e coloca no aplicativo.
            const data = docSnap.data();
            appData.trips = data.trips || [];
        } else {
            // 3. O cofre está vazio. Vamos fazer a Mágica da Migração!
            // Ele tenta achar dados velhos no PC local
            const localData = localStorage.getItem(STORAGE_KEY);
            if (localData) {
                console.log("Migrando dados locais para a nuvem...");
                const parsed = JSON.parse(localData);
                appData.trips = parsed.trips || [];
                
                // Salva na nuvem imediatamente
                await saveData(); 
                alert("✨ Mágica feita! Seus roteiros antigos foram encontrados no computador e migrados para a nuvem com sucesso!");
            }
        }
        
        // Como a busca na internet demora milissegundos, precisamos mandar a tela 
        // se desenhar de novo assim que os dados chegarem.
        if (window.render) window.render();
        
    } catch (error) {
        console.error("Erro ao carregar dados da nuvem:", error);
        alert("Erro de conexão ao tentar baixar os roteiros.");
    }
}

export async function saveData() {
    // Se não tiver ninguém logado, não deixa salvar
    if (!currentUser) return;

    // Pega aquela barrinha verde de "Salvo" lá no topo da tela
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
        indicator.innerText = '⏳ Salvando na nuvem...';
        indicator.classList.remove('opacity-0');
        indicator.classList.replace('bg-green-500', 'bg-blue-500'); // Fica azul enquanto pensa
        indicator.classList.replace('bg-red-500', 'bg-blue-500');
    }

    try {
        // Aponta para o documento do usuário
        const docRef = doc(db, "users", currentUser.uid);
        
        // Empurra o roteiro inteiro pro Firebase (usando await para esperar terminar)
        await setDoc(docRef, { trips: appData.trips });

        // Avisa que deu tudo certo!
        if (indicator) {
            indicator.innerText = '☁️ Salvo na nuvem';
            indicator.classList.replace('bg-blue-500', 'bg-green-500'); // Fica verde
            setTimeout(() => indicator.classList.add('opacity-0'), 2000);
        }
    } catch (error) {
        console.error("Erro ao salvar na nuvem:", error);
        
        // Avisa que deu erro de internet
        if (indicator) {
            indicator.innerText = '❌ Erro ao salvar';
            indicator.classList.replace('bg-blue-500', 'bg-red-500'); // Fica vermelho
            setTimeout(() => indicator.classList.add('opacity-0'), 3000);
        }
    }
}