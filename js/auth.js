import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export let currentUser = null;
export let authInitialized = false;

// 🛑 LISTA VIP ÚNICA
const VIP_LIST = [
    'gilsonmarcondes@gmail.com', 
    'gilson.marcondes@unesp.br',
    'amigo2@gmail.com'
];

export function initAuth(onSuccessCallback) {
    console.log("🚀 Auth: Observador configurado.");

    // Captura o resultado do redirect (essencial para telemóveis)
    getRedirectResult(auth).catch((error) => console.error("Erro redirect:", error));

    onAuthStateChanged(auth, (user) => {
        authInitialized = true;
        
        if (user) {
            const email = user.email.toLowerCase().trim();
            if (VIP_LIST.includes(email)) {
                currentUser = user;
                console.log("✅ Auth: Usuário VIP detectado:", email);
                if (onSuccessCallback) onSuccessCallback();
            } else {
                console.warn("🚫 Auth: Usuário barrado:", email);
                // Criamos um objeto claro para o roteador ler
                currentUser = { isBarrado: true, email: email }; 
            }
        } else {
            console.log("👤 Auth: Nenhum usuário logado.");
            currentUser = null;
        }

        // SEMPRE chama o render global para atualizar a tela
        if (window.render) window.render();
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth).then(() => window.location.reload());