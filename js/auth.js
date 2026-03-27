import { auth, provider } from './firebase.js';
// Trocamos o Redirect pelo Popup
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export let currentUser = null;
export let authInitialized = false;

// Sua lista VIP intacta
const VIP_LIST = [
    'gilsonmarcondes@gmail.com', 
    'gilson.marcondes@unesp.br',
    'mariliamartinscorrea1983@gmail.com'
];

export function initAuth(onSuccessCallback) {
    console.log("🚀 Auth: Observador iniciado com Popup.");

    onAuthStateChanged(auth, (user) => {
        authInitialized = true;
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
        
        if (window.render) window.render();
    });
}

// A MUDANÇA MÁGICA ESTÁ AQUI: Popup em vez de Redirect
export const loginUser = () => {
    signInWithPopup(auth, provider).catch((error) => {
        console.error("Erro no login com janela:", error);
        alert("Erro ao abrir a janela do Google. Verifique se o seu navegador não bloqueou o Pop-up.");
    });
};

export const logoutUser = () => signOut(auth).then(() => window.location.reload());