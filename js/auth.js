import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export let currentUser = null;
export let authInitialized = false;

// 🛑 SUA LISTA VIP (Emails em minúsculas)
const VIP_LIST = [
    'gilsonmarcondes@gmail.com',
    'gilson.marcondes@unesp.br',

];

export function initAuth(onSuccessCallback) {
    console.log("🚀 Auth: Iniciando...");

    getRedirectResult(auth).catch(err => console.error("Erro Redirect:", err));

    onAuthStateChanged(auth, (user) => {
        authInitialized = true;
        
        if (user) {
            const email = user.email.toLowerCase().trim();
            if (!VIP_LIST.includes(email)) {
                console.warn("🚫 Bloqueado:", email);
                showDeniedScreen(email);
                signOut(auth); // Desloga mas a tela já vai estar travada
                return;
            }
            currentUser = user;
            console.log("✅ VIP Confirmado:", email);
        } else {
            currentUser = null;
        }

        // Se chegou aqui, ou deslogou ou é VIP. Chama o roteador.
        if (window.render) window.render();
        if (currentUser && onSuccessCallback) onSuccessCallback();
    });
}

function showDeniedScreen(email) {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:80vh; font-family:sans-serif; text-align:center; padding:20px;">
                <div style="background:#fef2f2; border:2px solid #fecaca; padding:40px; border-radius:20px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); max-width:400px;">
                    <span style="font-size:70px;">🚫</span>
                    <h1 style="color:#b91c1c; margin:20px 0 10px;">Acesso Negado</h1>
                    <p style="color:#7f1d1d; margin-bottom:30px;">O e-mail <b>${email}</b> não está na lista VIP.</p>
                    <button onclick="window.location.reload()" style="background:#dc2626; color:white; border:none; padding:15px 30px; border-radius:10px; font-weight:bold; cursor:pointer; width:100%;">Tentar Outra Conta</button>
                </div>
            </div>`;
    }
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth).then(() => window.location.reload());