import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { loadData } from './store.js';

// EXPORTAÇÃO DO UTILIZADOR
export let currentUser = null;

export function initAuth(onSuccessCallback) {
    // 1. PRIMEIRO: Intercetar o regresso do telemóvel após o Google
    getRedirectResult(auth).then((result) => {
        if (result !== null) {
            console.log("Regresso do Google concluído com sucesso!");
            // O onAuthStateChanged vai apanhar isto logo a seguir
        }
    }).catch((error) => {
        // Se o telemóvel bloquear algo, vamos ver este aviso no ecrã!
        alert("Erro no login pelo telemóvel: " + error.message);
    });

    // 2. SEGUNDO: Ouvir o estado da autenticação
    onAuthStateChanged(auth, (user) => {
        currentUser = user; 
        if (user) {
            console.log("Logado como:", user.displayName);
            if (onSuccessCallback) onSuccessCallback(); 
        } else {
            // Só manda para a página inicial se não estiver logado
            if (window.render) window.render(); 
        }
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth);