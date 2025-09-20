// js/components/Navbar.js
import { renderLoginForm } from './LoginForm.js';
import { signOut } from '../services/authService.js';
import { renderPage } from '../main.js';

export function renderNavbar(user) {
    const navbarContainer = document.getElementById('navbar-container');
    
    let links = '';
    if (user) { // Utilisateur connecté (user ou admin)
        links += `<a href="#/" class="nav-link">Fil d'actualité</a>`;
        if (user.role === 'admin') {
            links += `<a href="#/users" class="nav-link">Utilisateurs</a>`;
        }
        links += `<button class="logout-btn">Déconnexion</button>`;
    } else { // Visiteur
        links += `<button class="login-btn">Connexion</button>`;
    }

    const navbarHTML = `
        <nav class="navbar">
            <a href="#/" class="navbar-brand">World Connect</a>
            <div class="nav-links">
                ${links}
            </div>
        </nav>
    `;
    navbarContainer.innerHTML = navbarHTML;

    // --- Événements ---
    const loginBtn = navbarContainer.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', renderLoginForm);
    }

    const logoutBtn = navbarContainer.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOut);
    }
    
    // Gérer la navigation SPA
    navbarContainer.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = new URL(e.currentTarget.href).hash;
            window.history.pushState({}, '', path);
            renderPage(); // Demande à main.js de redessiner la bonne page
        });
    });
}
