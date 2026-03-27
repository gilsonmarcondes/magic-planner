import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { loadData } from './store.js';

// EXPORTAÇÃO DO UTILIZADOR
export let currentUser = null;

// 🛑 A SUA LISTA VIP DE E-MAILS (Substitua pelos e-mails reais)
const emailsPermitidos = [
    'gilsonmarcondes@gmail.com',       // O seu e-mail
    'gilson.marcondes@unesp.br',          // E-mail da 2ª pessoa
    'amigo2@gmail.com'           // E-mail da 3ª pessoa
];

export function initAuth(onSuccessCallback) {
    // Intercetar o regresso após o login no Google
    getRedirectResult(auth).catch((error) => {
        alert("Erro no login: " + error.message);
    });

    // Ouvir o estado da autenticação
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // VERIFICAÇÃO DE SEGURANÇA: O e-mail está na lista?
            if (!emailsPermitidos.includes(user.email)) {
                alert(`Acesso Negado! O e-mail ${user.email} não tem autorização para aceder a este roteiro.`);
                logoutUser(); // Desloga o intruso imediatamente
                return; // Pára a execução aqui
            }

            // Se passou na segurança, carrega a aplicação
            currentUser = user; 
            console.log("Logado com sucesso:", user.displayName);
            if (onSuccessCallback) onSuccessCallback(); 
            
        } else {
            // Ninguém logado (ou intruso expulso)
            currentUser = null;
            if (window.render) window.render(); 
        }
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth);