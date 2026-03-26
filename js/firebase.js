// --- INICIALIZAÇÃO DO FIREBASE ---
// Importamos os módulos diretamente da rede (CDN) compatíveis com o navegador
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Importamos as chaves que colocamos no config.js
import { FIREBASE_CONFIG } from './config.js';

// 1. Ligamos o aplicativo
const app = initializeApp(FIREBASE_CONFIG);

// 2. Preparamos o Banco de Dados (Firestore) e o Login (Auth)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// 3. Exportamos as ferramentas de login para podermos criar o botão depois
export { signInWithPopup, signOut, onAuthStateChanged };