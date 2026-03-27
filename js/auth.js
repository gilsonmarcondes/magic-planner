import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export let currentUser = null;
export let authInitialized = false; // A bandeira que avisa que o login foi verificado

export function initAuth(onSuccessCallback) {
    getRedirectResult(auth).catch((error) => console.error("Erro no redirect:", error));

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authInitialized = true; // Agora o sistema sabe que pode decidir a tela
        
        console.log("👤 Auth Status:", user ? "Logado: " + user.email : "Deslogado");
        
        if (window.render) window.render(); 
        if (user && onSuccessCallback) onSuccessCallback();
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth).then(() => window.location.reload());