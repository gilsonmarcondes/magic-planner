import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export let currentUser = null;
export let authInitialized = false;

// 🛑 LISTA VIP ÚNICA (Centralizada aqui)
const VIP_LIST = [
    'gilsonmarcondes@gmail.com', 
    'gilson.marcondes@unesp.br',
    'amigo2@gmail.com'
];

export function initAuth(onSuccessCallback) {
    console.log("🚀 Auth: Aguardando sinal do Google...");

    // Captura o resultado do login após o redirecionamento
    getRedirectResult(auth).catch((error) => console.error("Erro no login:", error));

    onAuthStateChanged(auth, (user) => {
        authInitialized = true;
        
        if (user) {
            const email = user.email.toLowerCase().trim();
            if (VIP_LIST.includes(email)) {
                currentUser = user; // Utilizador VIP validado
                console.log("✅ VIP Confirmado:", email);
                if (onSuccessCallback) onSuccessCallback();
            } else {
                console.warn("🚫 Não autorizado:", email);
                // Criamos um marcador claro para o roteador
                currentUser = { isBarrado: true, email: email }; 
            }
        } else {
            console.log("👤 Nenhum utilizador detetado.");
            currentUser = null;
        }

        // Avisa o roteador para atualizar a tela
        if (window.render) window.render();
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth).then(() => window.location.reload());