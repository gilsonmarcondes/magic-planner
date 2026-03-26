import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { FIREBASE_CONFIG } from './config.js';

// Inicializa o Firebase
const app = initializeApp(FIREBASE_CONFIG);

// EXPORTAÇÕES OBRIGATÓRIAS (Verifique se o seu tem o 'export' na frente!)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();