import { auth, provider } from './firebase.js';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export let currentUser = null;
export let authInitialized = false;

const VIP_LIST = [
    'gilsonmarcondes@gmail.com', 
    'gilson.marcondes@unesp.br',
    'amigo2@gmail.com'
];

export function initAuth(onSuccessCallback) {
    onAuthStateChanged(auth, (user) => {
        authInitialized = true;
        
        if (user) {
            const email = user.email.toLowerCase().trim();
            if (VIP_LIST.includes(email)) {
                currentUser = user;
                if (onSuccessCallback) onSuccessCallback();
            } else {
                currentUser = "BARRADO"; 
            }
        } else {
            currentUser = null;
        }

        if (window.render) window.render();
    });
}

export const loginUser = () => signInWithRedirect(auth, provider);
export const logoutUser = () => signOut(auth).then(() => window.location.reload());