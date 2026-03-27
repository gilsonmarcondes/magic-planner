import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export let currentUser = null;

export function initAuth(onSuccessCallback) {
    getRedirectResult(auth).catch((error) => console.error("Erro redirect:", error));

    onAuthStateChanged(auth, (user) => {
        currentUser = user; // Guarda o usuário (seja ele VIP ou não)
        if (window.render) window.render(); // Manda o roteador decidir o que mostrar
        if (user && onSuccessCallback) onSuccessCallback();
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth);