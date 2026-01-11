// usereact.js - Chargement progressif avec bouton "Charger plus"

(function() {
    'use strict';

    const UserReactionsWidget = {
        supabase: null,
        currentUser: null,
        userProfile: null,
        articleId: null,
        allReactions: [],
        displayedReactions: [],
        currentOffset: 0,
        batchSize: 1000,
        totalCount: 0,
        totalUsers: 0,
        currentFilter: 'all',

        async init() {
            if (window.supabaseClient) {
                this.supabase = window.supabaseClient.supabase;
                this.currentUser = await window.supabaseClient.getCurrentUser();
                if (this.currentUser) {
                    this.userProfile = await window.supabaseClient.getUserProfile(this.currentUser.id);
                }
            }

            const urlParams = new URLSearchParams(window.location.search);
            this.articleId = urlParams.get('article_id');

            if (!this.articleId) {
                console.error('Aucun article_id fourni');
                document.getElementById('user-reactions-container').innerHTML = `<p>Erreur: ID de l'article manquant.</p>`;
                return;
            }
            await this.loadInitialData();
        },

        // ✅ COMPTER LE TOTAL SANS TOUT CHARGER
        async getTotalCounts() {
            console.log('📊 Récupération des statistiques totales...');

            // Compter le nombre total de réactions
            const { count: totalReactions, error: countError } = await this.supabase
                .from('reactions_with_actor_info')
                .select('*', { count: 'exact', head: true })
                .eq('article_id', this.articleId);

            if (countError) throw countError;

            // Récupérer toutes les réactions pour compter les types et utilisateurs uniques
            // (On doit les récupérer toutes pour grouper, mais on ne les affichera pas toutes)
            const allReactions = await this.fetchAllReactions();
            
            const uniqueUsers = new Set(allReactions.map(r => r.acteur_id));

            console.log(`✅ Total: ${totalReactions} réactions par ${uniqueUsers.size} utilisateurs`);

            return {
                totalReactions,
                totalUsers: uniqueUsers.size,
                allReactions
            };
        },

        // ✅ CHARGER TOUTES LES RÉACTIONS (pour stats et filtrage)
        async fetchAllReactions() {
            const allReactions = [];
            let offset = 0;
            const batchSize = 1000;
            let hasMore = true;

            console.log('📥 Chargement de toutes les réactions pour les statistiques...');

            while (hasMore) {
                const { data, error } = await this.supabase
                    .from('reactions_with_actor_info')
                    .select('*')
                    .eq('article_id', this.articleId)
                    .order('date_created', { ascending: false })
                    .range(offset, offset + batchSize - 1);

                if (error) throw error;

                if (!data || data.length === 0) {
                    hasMore = false;
                } else {
                    allReactions.push(...data);
                    console.log(`📦 ${data.length} réactions chargées (offset ${offset})`);
                    
                    if (data.length < batchSize) {
                        hasMore = false;
                    } else {
                        offset += batchSize;
                    }
                }
            }

            console.log(`✅ ${allReactions.length} réactions totales chargées`);
            return allReactions;
        },

        async loadInitialData() {
            const container = document.getElementById('user-reactions-container');
            container.innerHTML = `
                <div class="loader">
                    <div class="spinner"></div>
                    <p>Chargement des statistiques...</p>
                </div>`;

            try {
                // Récupérer les statistiques et toutes les réactions
                const { totalReactions, totalUsers, allReactions } = await this.getTotalCounts();
                this.totalCount = totalReactions;
                this.totalUsers = totalUsers;
                this.allReactions = allReactions;

                // Charger l'article
                const { data: article, error: articleError } = await this.supabase
                    .from('articles')
                    .select('*, users_profile(prenom, nom)')
                    .eq('article_id', this.articleId)
                    .single();

                if (articleError) throw articleError;

                // Afficher la page avec le premier lot
                this.renderPageLayout(container, article);
                this.loadMoreReactions(); // Charger les 1000 premiers

            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erreur de chargement</h3>
                        <p>Impossible de charger les réactions.</p>
                    </div>`;
            }
        },

        renderPageLayout(container, article) {
            if (this.allReactions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-heart-broken"></i>
                        <h3>Aucune réaction</h3>
                        <p>Cet article n'a pas encore reçu de réactions.</p>
                    </div>`;
                return;
            }
            
            const reactionsByType = this.groupReactionsByType(this.allReactions);

            let html = `
                <div class="article-info-header">
                    <div class="article-mini-card">
                        <div class="article-mini-author">
                            <div class="avatar-mini">${article.users_profile.prenom[0]}${article.users_profile.nom[0]}</div>
                            <div>
                                <h4>${article.users_profile.prenom} ${article.users_profile.nom}</h4>
                                <p>${new Date(article.date_created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div class="article-mini-text">${this.truncateText(article.texte, 100)}</div>
                    </div>
                </div>

                <div class="reactions-summary">
                    <h3>
                        <i class="fas fa-chart-bar"></i>
                        Résumé (${this.totalCount} réactions par ${this.totalUsers} utilisateurs)
                    </h3>
                    <div class="reactions-stats">
                        ${this.renderReactionStat('like', 'thumbs-up', reactionsByType.like.length)}
                        ${this.renderReactionStat('love', 'heart', reactionsByType.love.length)}
                        ${this.renderReactionStat('rire', 'laugh', reactionsByType.rire.length)}
                        ${this.renderReactionStat('colere', 'angry', reactionsByType.colere.length)}
                    </div>
                </div>

                <div class="reactions-tabs">
                    <button class="tab-btn active" data-type="all"><i class="fas fa-list"></i> Toutes (${this.totalUsers})</button>
                    <button class="tab-btn" data-type="like"><i class="fas fa-thumbs-up"></i> J'aime (${new Set(reactionsByType.like.map(r => r.acteur_id)).size})</button>
                    <button class="tab-btn" data-type="love"><i class="fas fa-heart"></i> Amour (${new Set(reactionsByType.love.map(r => r.acteur_id)).size})</button>
                    <button class="tab-btn" data-type="rire"><i class="fas fa-laugh"></i> Rire (${new Set(reactionsByType.rire.map(r => r.acteur_id)).size})</button>
                    <button class="tab-btn" data-type="colere"><i class="fas fa-angry"></i> Colère (${new Set(reactionsByType.colere.map(r => r.acteur_id)).size})</button>
                </div>

                <div id="loading-info" style="text-align: center; padding: 16px; color: var(--text-tertiary); font-size: 14px;">
                    Chargement des utilisateurs...
                </div>

                <div class="reactions-list" id="reactions-list"></div>
                
                <div id="load-more-container" style="text-align: center; padding: 20px; display: none;">
                    <button id="load-more-btn" style="
                        background: linear-gradient(135deg, #8B8B5C 0%, #6B6B4C 100%);
                        border: none;
                        padding: 14px 32px;
                        border-radius: 12px;
                        color: white;
                        cursor: pointer;
                        font-size: 15px;
                        font-weight: 600;
                        box-shadow: 0 4px 14px rgba(139, 139, 92, 0.25);
                        transition: all 0.3s ease;
                    ">
                        <i class="fas fa-arrow-down"></i> Charger plus d'utilisateurs
                    </button>
                </div>
            `;
            container.innerHTML = html;
            
            this.initTabs();
            this.initLoadMoreButton();
        },
        
        // ✅ CHARGER LA PROCHAINE VAGUE D'UTILISATEURS
        loadMoreReactions() {
            const reactionsToShow = this.currentFilter === 'all' 
                ? this.allReactions 
                : this.allReactions.filter(r => r.reaction_type === this.currentFilter);

            // Grouper par utilisateur pour savoir combien d'utilisateurs on a
            const usersData = this.groupReactionsByUser(reactionsToShow);
            const allUsers = Object.values(usersData).sort((a, b) => b.latestDate - a.latestDate);

            // Prendre les utilisateurs suivants
            const startIndex = this.currentOffset;
            const endIndex = Math.min(startIndex + this.batchSize, allUsers.length);
            const usersToAdd = allUsers.slice(startIndex, endIndex);

            // Ajouter à l'affichage
            this.displayedReactions.push(...usersToAdd);
            this.currentOffset = endIndex;

            // Mettre à jour l'affichage
            this.renderUserList(this.displayedReactions);

            // Mettre à jour les infos
            const loadingInfo = document.getElementById('loading-info');
            const loadMoreContainer = document.getElementById('load-more-container');
            const loadMoreBtn = document.getElementById('load-more-btn');

            const totalUsersInFilter = allUsers.length;
            const remaining = totalUsersInFilter - this.currentOffset;

            if (loadingInfo) {
                loadingInfo.innerHTML = `Affichage de <strong>${this.currentOffset}</strong> sur <strong>${totalUsersInFilter}</strong> utilisateurs`;
            }

            if (remaining > 0) {
                loadMoreContainer.style.display = 'block';
                const toLoad = Math.min(remaining, this.batchSize);
                loadMoreBtn.innerHTML = `<i class="fas fa-arrow-down"></i> Charger ${toLoad} utilisateur${toLoad > 1 ? 's' : ''} supplémentaire${toLoad > 1 ? 's' : ''}`;
            } else {
                loadMoreContainer.style.display = 'none';
                loadingInfo.innerHTML = `Tous les <strong>${totalUsersInFilter}</strong> utilisateurs sont affichés`;
            }

            console.log(`✅ ${usersToAdd.length} utilisateurs ajoutés (${this.currentOffset}/${totalUsersInFilter})`);
        },

        groupReactionsByUser(reactions) {
            const usersData = {};
            reactions.forEach(reaction => {
                const acteurId = reaction.acteur_id;
                if (!usersData[acteurId]) {
                    usersData[acteurId] = {
                        prenom: reaction.prenom_acteur, 
                        nom: reaction.nom_acteur,      
                        reactions: [],
                        latestDate: new Date(0)
                    };
                }
                usersData[acteurId].reactions.push({
                    type: reaction.reaction_type,
                    date: new Date(reaction.date_created)
                });
                if (new Date(reaction.date_created) > usersData[acteurId].latestDate) {
                    usersData[acteurId].latestDate = new Date(reaction.date_created);
                }
            });
            return usersData;
        },

        groupReactionsByType(reactions) {
            const grouped = { like: [], love: [], rire: [], colere: [] };
            reactions.forEach(reaction => {
                if (grouped[reaction.reaction_type]) {
                    grouped[reaction.reaction_type].push(reaction);
                }
            });
            return grouped;
        },

        renderReactionStat(type, icon, count) {
            const colors = { like: '#3b82f6', love: '#ef4444', rire: '#f59e0b', colere: '#dc2626' };
            const labels = { like: 'J\'aime', love: 'Amour', rire: 'Rire', colere: 'Colère' };
            return `
                <div class="reaction-stat" style="border-left: 4px solid ${colors[type]};">
                    <i class="fas fa-${icon}" style="color: ${colors[type]};"></i>
                    <div class="stat-info">
                        <span class="stat-label">${labels[type]}</span>
                        <span class="stat-count">${count}</span>
                    </div>
                </div>`;
        },

        renderUserList(usersArray) {
            const listContainer = document.getElementById('reactions-list');
            if (!listContainer) return;

            const reactionDetails = {
                like: { icon: 'thumbs-up', color: '#3b82f6', label: 'J\'aime' },
                love: { icon: 'heart', color: '#ef4444', label: 'Amour' },
                rire: { icon: 'laugh', color: '#f59e0b', label: 'Rire' },
                colere: { icon: 'angry', color: '#dc2626', label: 'Colère' }
            };

            const html = usersArray.map(userData => {
                const initials = `${userData.prenom[0]}${userData.nom[0]}`.toUpperCase();
                
                userData.reactions.sort((a, b) => b.date - a.date);

                const badgesHtml = userData.reactions.map(reaction => {
                    const info = reactionDetails[reaction.type];
                    return `
                        <div class="reaction-badge" style="background: ${info.color};" title="${info.label} - ${this.formatDate(reaction.date)}">
                            <i class="fas fa-${info.icon}"></i>
                            <span>${info.label}</span>
                        </div>`;
                }).join('');

                return `
                    <div class="reaction-item">
                        <div class="reaction-user-info">
                            <div class="avatar">${initials}</div>
                            <div class="user-details">
                                <h4>${userData.prenom} ${userData.nom}</h4>
                                <p>Dernière réaction: ${this.formatDate(userData.latestDate)}</p>
                            </div>
                        </div>
                        <div class="reaction-badges-container">
                            ${badgesHtml}
                        </div>
                    </div>`;
            }).join('');

            listContainer.innerHTML = html;
        },

        initLoadMoreButton() {
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => {
                    loadMoreBtn.disabled = true;
                    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
                    
                    setTimeout(() => {
                        this.loadMoreReactions();
                        loadMoreBtn.disabled = false;
                    }, 300);
                });

                // Effet hover
                loadMoreBtn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 6px 20px rgba(139, 139, 92, 0.35)';
                });
                loadMoreBtn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 14px rgba(139, 139, 92, 0.25)';
                });
            }
        },

        initTabs() {
            const tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    const type = tab.getAttribute('data-type');
                    this.currentFilter = type;
                    this.displayedReactions = [];
                    this.currentOffset = 0;

                    // Réinitialiser et charger
                    document.getElementById('reactions-list').innerHTML = '';
                    this.loadMoreReactions();
                });
            });
        },

        truncateText(text, maxLength) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        },

        formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now - date;
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 7) {
                return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
            } else if (days > 0) {
                return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
            } else if (hours > 0) {
                return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
            } else if (minutes > 0) {
                return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
            } else {
                return 'À l\'instant';
            }
        }
    };

    document.addEventListener('DOMContentLoaded', () => UserReactionsWidget.init());
    window.UserReactionsWidget = UserReactionsWidget;
})();
