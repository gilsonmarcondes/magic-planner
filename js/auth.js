import { auth, provider } from './firebase.js';
// AQUI: Trocamos o signInWithPopup pelo signInWithRedirect e adicionamos o getRedirectResult
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { loadData } from './store.js';

// EXPORTAÇÃO DO USUÁRIO
export let currentUser = null;

export function initAuth(onSuccessCallback) {
    // Garante que o sistema capture eventuais erros ao voltar da tela do Google
    getRedirectResult(auth).catch((error) => {
        console.error("Erro no login por redirecionamento:", error);
        alert("Erro ao tentar fazer login: " + error.message);
    });

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

// A MÁGICA PARA O CELULAR: Usar Redirect em vez de Popup
export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth);