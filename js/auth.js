// --- AUTENTICAÇÃO FIREBASE ---
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged } from './firebase.js';

export let currentUser = null;

export function initAuth(onLoginSuccess) {
    const loginScreen = document.getElementById('loginScreen');
    const btnLogin = document.getElementById('btnLogin');
    const loginLoading = document.getElementById('loginLoading');

    // Fica "escutando" para ver se o usuário logou ou deslogou
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Está logado! Salva quem é o usuário
            currentUser = user;
            
            // Esconde a tela de login com um efeito de fade
            if (loginScreen) {
                loginScreen.classList.add('opacity-0');
                setTimeout(() => loginScreen.classList.add('hidden'), 500);
            }
            
            // Avisa o main.js que pode carregar o aplicativo
            onLoginSuccess();
        } else {
            // Não está logado! Mostra a tela de login.
            currentUser = null;
            if (loginScreen) loginScreen.classList.remove('hidden', 'opacity-0');
            if (btnLogin) btnLogin.classList.remove('hidden');
            if (loginLoading) loginLoading.classList.add('hidden');
        }
    });

    // Configura o clique do botão "Entrar com o Google"
    if (btnLogin) {
        btnLogin.onclick = async () => {
            btnLogin.classList.add('hidden');
            loginLoading.classList.remove('hidden');
            try {
                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error("Erro ao logar:", error);
                alert("Falha ao entrar com o Google. Tente novamente.");
                btnLogin.classList.remove('hidden');
                loginLoading.classList.add('hidden');
            }
        };
    }
}

export function logoutUser() {
    if (confirm("Deseja mesmo sair da sua conta?")) {
        signOut(auth).then(() => {
            window.location.reload(); // Recarrega a página para voltar à tela de login
        });
    }
}