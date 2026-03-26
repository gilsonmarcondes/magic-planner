import { auth, provider } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { loadData } from './store.js';

// EXPORTAÇÃO DO USUÁRIO
export let currentUser = null;

export function initAuth(onSuccessCallback) {
    onAuthStateChanged(auth, (user) => {
        currentUser = user; // Atualiza quem está logado
        if (user) {
            console.log("Logado como:", user.displayName);
            if (onSuccessCallback) onSuccessCallback(); 
        } else {
            if (window.render) window.render(); // Volta para a tela de login
        }
    });
}

// Outras exportações necessárias
export const loginUser = () => signInWithPopup(auth, provider);
export const logoutUser = () => signOut(auth);