import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { loadData } from './store.js';

export let currentUser = null;

// 🛑 A SUA LISTA VIP DE E-MAILS
const emailsPermitidos = [
    'gilsonmarcondes@gmail.com',       // E-mail 1
    'gilson.marcondes@unesp.br',          // E-mail 2
    'amigo2@gmail.com'           // E-mail 3
];

export function initAuth(onSuccessCallback) {
    getRedirectResult(auth).catch((error) => console.error("Erro no login:", error));

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // VERIFICAÇÃO VIP
            if (!emailsPermitidos.includes(user.email)) {
                
                // Em vez de um alert(), desenhamos um Ecrã de Erro gigante na aplicação
                const app = document.getElementById('app');
                if (app) {
                    app.innerHTML = `
                        <div class="flex flex-col justify-center items-center min-h-[80vh] px-4 animate-fade-in">
                            <div class="text-center bg-red-50 p-8 rounded-2xl shadow-2xl max-w-sm w-full border-2 border-red-200">
                                <span class="text-7xl mb-4 block">🚫</span>
                                <h1 class="font-magic text-3xl text-red-700 mb-2 uppercase font-bold">Acesso Negado</h1>
                                <p class="text-sm text-red-800 mb-8 font-mono">O e-mail <br><b class="text-blue-900">${user.email}</b><br> não está na lista VIP desta viagem.</p>
                                <button onclick="window.location.reload()" class="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-red-700 transition active:scale-95 uppercase tracking-widest text-xs">Tentar Outra Conta</button>
                            </div>
                        </div>`;
                }
                
                // Esconde a barra de baixo por precaução
                const nav = document.getElementById('bottomNav');
                if (nav) nav.style.display = 'none';

                // Faz o logout em segundo plano e interrompe o código
                signOut(auth);
                return; 
            }

            // Se passou na segurança, entra normalmente!
            currentUser = user; 
            console.log("Logado com sucesso:", user.displayName);
            if (onSuccessCallback) onSuccessCallback(); 
            
        } else {
            currentUser = null;
            // Só desenha o ecrã de login normal se NÃO houver um erro vermelho na tela
            const app = document.getElementById('app');
            if (app && !app.innerHTML.includes('Acesso Negado')) {
                if (window.render) window.render(); 
            }
        }
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth);