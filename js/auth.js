import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export let currentUser = null;
export let authInitialized = false; // Importante para o Router saber que já pode carregar

// 🛑 SUA LISTA VIP (Coloque os e-mails aqui)
const VIP_LIST = ['gilsonmarcondes@gmail.com', 'gilson.marcondes@unesp.br'];

export function initAuth(onSuccessCallback) {
    console.log("🚀 Auth: Observador configurado. Aguardando Firebase...");

    onAuthStateChanged(auth, (user) => {
        authInitialized = true;
        
        if (user) {
            const email = user.email.toLowerCase().trim();
            if (VIP_LIST.includes(email)) {
                currentUser = user;
                console.log("✅ Auth: Usuário VIP detectado:", email);
                if (onSuccessCallback) onSuccessCallback();
            } else {
                console.warn("🚫 Auth: Usuário barrado (Não VIP):", email);
                currentUser = "BARRADO"; // Sinal para o roteador mostrar a tela vermelha
            }
        } else {
            console.log("👤 Auth: Nenhum usuário logado.");
            currentUser = null;
        }

        // SEMPRE chama o render global para atualizar a tela, independente do resultado
        if (window.render) window.render();
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth).then(() => window.location.reload());