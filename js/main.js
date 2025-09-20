// js/main.js

import { db } from './supabaseClient.js'; // <-- C'EST LA LIGNE QUI MANQUAIT
import { getCurrentUser } from './services/authService.js';
import { renderNavbar } from './components/Navbar.js';
import { renderPostFeed } from './components/PostFeed.js';
import { renderUserList } from './components/UserList.js';

// L'état global de l'application. On stocke l'utilisateur connecté ici.
export const state = {
    user: null
};

const appContainer = document.getElementById('app-container');

// Le "routeur" : il décide quelle "page" afficher
export async function renderPage() {
    // Vider le conteneur principal
    appContainer.innerHTML = '<h2>Chargement...</h2>';
    
    const path = window.location.hash || '#/';

    if (path === '#/') {
        appContainer.innerHTML = ''; // On vide pour que le composant prenne la place
        appContainer.appendChild(await renderPostFeed());
    } else if (path === '#/users' && state.user && state.user.role === 'admin') {
        appContainer.innerHTML = '';
        appContainer.appendChild(await renderUserList());
    } else {
        appContainer.innerHTML = '<h2>Page non trouvée</h2>';
    }
}

// Fonction d'initialisation
async function initializeApp() {
    // 1. Récupérer l'utilisateur
    state.user = await getCurrentUser();

    // 2. Afficher la barre de navigation
    renderNavbar(state.user);

    // 3. Afficher le contenu de la page actuelle
    renderPage();
    
    // Écouter les changements d'état de connexion (ex: après connexion via le lien magique)
    db.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            // Recharger l'application pour mettre à jour l'état partout
            window.location.reload();
        }
    });
}

// Gérer la navigation avec les boutons précédent/suivant du navigateur
window.addEventListener('popstate', renderPage);

// Lancer l'application !
initializeApp();
