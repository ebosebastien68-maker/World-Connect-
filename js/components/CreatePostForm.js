// js/components/CreatePostForm.js
import { addPost } from '../services/dataService.js';
import { state } from '../main.js'; // Pour obtenir le user.id

export function renderCreatePostForm() {
    const form = document.createElement('div');
    form.className = 'form-card';
    form.innerHTML = `
        <h3>Créer une nouvelle publication</h3>
        <input type="text" id="post-title" placeholder="Titre (facultatif)">
        <textarea id="post-content" rows="4" placeholder="Quoi de neuf ?"></textarea>
        <button id="submit-post">Publier</button>
    `;

    form.querySelector('#submit-post').addEventListener('click', async () => {
        const title = form.querySelector('#post-title').value;
        const content = form.querySelector('#post-content').value;

        if (!content) {
            alert('Le contenu ne peut pas être vide.');
            return;
        }

        await addPost(state.user.id, content, title);
        
        // Rafraîchir la page pour voir le nouveau post
        window.location.hash = '#/';
        window.location.reload(); 
    });

    return form;
}
