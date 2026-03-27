import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export let currentUser = null;
export let authInitialized = false;

// 🛑 SUA LISTA VIP DEFINITIVA
const VIP_LIST = [
    'gilsonmarcondes@gmail.com', 
    'gilson.marcondes@unesp.br',
    'amigo2@gmail.com'
];

export function initAuth(onSuccessCallback) {
    console.log("🚀 Auth: Observador iniciado.");

    // Essencial para que o login funcione no celular
    getRedirectResult(auth).catch((error) => console.error("Erro no redirect:", error));

    onAuthStateChanged(auth, (user) => {
        authInitialized = true; // Avisa que o carregamento acabou
        
        if (user) {
            const email = user.email.toLowerCase().trim();
            if (VIP_LIST.includes(email)) {
                currentUser = user;
                console.log("✅ VIP Confirmado:", email);
                if (onSuccessCallback) onSuccessCallback();
            } else {
                console.warn("🚫 Acesso negado para:", email);
                currentUser = { isBarrado: true, email: email }; 
            }
        } else {
            console.log("👤 Nenhum usuário logado.");
            currentUser = null;
        }

        // Força a atualização da tela no roteador
        if (window.render) window.render();
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth).then(() => window.location.reload());