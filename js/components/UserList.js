// js/components/UserList.js
import { getUsers, searchUsers } from '../services/dataService.js';

export async function renderUserList() {
    const container = document.createElement('div');
    container.id = 'user-management';

    const searchBar = document.createElement('div');
    searchBar.className = 'form-card';
    searchBar.innerHTML = `
        <h3>Gérer les utilisateurs</h3>
        <input type="search" id="search-users-input" placeholder="Rechercher par nom ou prénom...">
    `;
    container.appendChild(searchBar);
    
    const userList = document.createElement('div');
    userList.id = 'user-list';
    container.appendChild(userList);

    const renderList = (users) => {
        userList.innerHTML = '';
        if (users.length === 0) {
            userList.innerHTML = '<p>Aucun utilisateur trouvé.</p>';
            return;
        }
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-list-item';
            userItem.innerHTML = `
                <span>${user.first_name || ''} ${user.last_name || ''}</span>
                <span>${user.role}</span>
            `;
            userList.appendChild(userItem);
        });
    };

    // Affichage initial
    const initialUsers = await getUsers();
    renderList(initialUsers);

    // Événements
    searchBar.querySelector('#search-users-input').addEventListener('input', async (e) => {
        const keyword = e.target.value;
        if (keyword.length > 1) {
            const results = await searchUsers(keyword);
            renderList(results);
        } else if (keyword.length === 0) {
            const allUsers = await getUsers();
            renderList(allUsers);
        }
    });

    return container;
}
