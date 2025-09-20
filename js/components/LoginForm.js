// js/components/LoginForm.js
import { signInWithMagicLink, signInWithPassword } from '../services/authService.js';

export function renderLoginForm() {
    const modalContainer = document.getElementById('modal-container');
    
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <button id="close-modal" style="float: right;">X</button>
                <h2>Connexion</h2>
                
                <div id="user-login-view">
                    <p>Entrez votre email pour recevoir un lien de connexion.</p>
                    <input type="email" id="email-magiclink" placeholder="votre.email@exemple.com" required>
                    <button id="magiclink-btn">Envoyer le lien</button>
                </div>

                <div id="admin-login-view" style="display: none;">
                    <p>Connexion Administrateur</p>
                    <input type="email" id="email-admin" placeholder="email.admin@exemple.com" required>
                    <input type="password" id="password-admin" placeholder="Mot de passe" required>
                    <button id="password-btn">Se connecter</button>
                </div>

                <p id="admin-toggle">Vous êtes administrateur ?</p>
            </div>
        </div>
    `;
    modalContainer.innerHTML = modalHTML;

    // --- Gestion des événements ---
    const overlay = modalContainer.querySelector('.modal-overlay');
    const closeModalBtn = modalContainer.querySelector('#close-modal');
    
    const close = () => modalContainer.innerHTML = '';
    
    closeModalBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            close();
        }
    });

    // Basculer entre User et Admin
    const adminToggle = modalContainer.querySelector('#admin-toggle');
    const userView = modalContainer.querySelector('#user-login-view');
    const adminView = modalContainer.querySelector('#admin-login-view');
    
    adminToggle.addEventListener('click', () => {
        if (adminView.style.display === 'none') {
            userView.style.display = 'none';
            adminView.style.display = 'block';
            adminToggle.textContent = "Vous êtes un utilisateur ?";
        } else {
            userView.style.display = 'block';
            adminView.style.display = 'none';
            adminToggle.textContent = "Vous êtes administrateur ?";
        }
    });

    // Logique de connexion
    modalContainer.querySelector('#magiclink-btn').addEventListener('click', () => {
        const email = modalContainer.querySelector('#email-magiclink').value;
        if (email) signInWithMagicLink(email);
    });

    modalContainer.querySelector('#password-btn').addEventListener('click', () => {
        const email = modalContainer.querySelector('#email-admin').value;
        const password = modalContainer.querySelector('#password-admin').value;
        if (email && password) signInWithPassword(email, password);
    });
}
