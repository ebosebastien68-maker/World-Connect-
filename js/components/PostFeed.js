// js/components/PostFeed.js
import { getPosts, searchPosts, addComment } from '../services/dataService.js';
import { state } from '../main.js';
import { renderCreatePostForm } from './CreatePostForm.js';

export async function renderPostFeed() {
    const container = document.createElement('div');
    container.id = 'post-feed';

    // Ajout du formulaire de publication pour l'admin
    if (state.user && state.user.role === 'admin') {
        container.appendChild(renderCreatePostForm());
    }

    // Ajout de la barre de recherche
    const searchBar = document.createElement('div');
    searchBar.className = 'form-card';
    searchBar.innerHTML = `
        <input type="search" id="search-posts-input" placeholder="Rechercher un article par mot-clé...">
    `;
    container.appendChild(searchBar);
    
    const postList = document.createElement('div');
    postList.id = 'post-list';
    container.appendChild(postList);

    const renderList = async (posts) => {
        postList.innerHTML = ''; // Vider la liste
        if (posts.length === 0) {
            postList.innerHTML = '<p>Aucune publication trouvée.</p>';
        }
        posts.forEach(post => {
            const postEl = document.createElement('div');
            postEl.className = 'post-card';

            const authorName = post.profiles ? `${post.profiles.first_name || ''} ${post.profiles.last_name || ''}`.trim() : 'Anonyme';
            
            let commentsHTML = post.comments.map(comment => {
                const commenterName = comment.profiles ? `${comment.profiles.first_name || ''} ${comment.profiles.last_name || ''}`.trim() : 'Anonyme';
                return `<div class="comment"><strong>${commenterName}:</strong> ${comment.content}</div>`;
            }).join('');

            postEl.innerHTML = `
                <div class="post-card-header">${authorName}</div>
                <div class="post-card-body">
                    ${post.title ? `<h3>${post.title}</h3>` : ''}
                    <p>${post.content}</p>
                </div>
                <div class="post-card-footer">
                    <div class="comments-section">${commentsHTML}</div>
                    ${state.user ? `
                        <div class="comment-form">
                            <input type="text" class="comment-input" data-post-id="${post.id}" placeholder="Ajouter un commentaire...">
                        </div>
                    ` : '<p><small>Connectez-vous pour commenter.</small></p>'}
                </div>
            `;
            postList.appendChild(postEl);
        });
    };

    // Affichage initial
    const initialPosts = await getPosts();
    renderList(initialPosts);

    // Événements
    searchBar.querySelector('#search-posts-input').addEventListener('input', async (e) => {
        const keyword = e.target.value;
        if (keyword.length > 2) {
            const results = await searchPosts(keyword);
            renderList(results);
        } else if (keyword.length === 0) {
            const allPosts = await getPosts();
            renderList(allPosts);
        }
    });

    postList.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('comment-input')) {
            const content = e.target.value;
            const postId = e.target.dataset.postId;
            if (content && postId && state.user) {
                await addComment(postId, state.user.id, content);
                // Simple refresh pour voir le nouveau commentaire
                window.location.reload();
            }
        }
    });

    return container;
}
