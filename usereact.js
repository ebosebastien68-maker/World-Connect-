// usereact.js - Gestion de l'affichage des utilisateurs avec PAGINATION COMPLÈTE

(function() {
    'use strict';

    const UserReactionsWidget = {
        supabase: null,
        currentUser: null,
        userProfile: null,
        articleId: null,
        allReactions: [],

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
            await this.loadReactions();
        },

        // ✅ FONCTION DE PAGINATION COMPLÈTE
        async fetchAllReactions(articleId) {
            const allReactions = [];
            let offset = 0;
            const batchSize = 1000;
            let hasMore = true;

            console.log('📥 Début de la pagination des réactions...');

            while (hasMore) {
                const { data, error } = await this.supabase
                    .from('reactions_with_actor_info')
                    .select('*')
                    .eq('article_id', articleId)
                    .order('date_created', { ascending: false })
                    .range(offset, offset + batchSize - 1);

                if (error) {
                    console.error(`❌ Erreur pagination à offset ${offset}:`, error);
                    throw error;
                }

                if (!data || data.length === 0) {
                    hasMore = false;
                    console.log(`✅ Fin de pagination (0 résultats à offset ${offset})`);
                } else {
                    allReactions.push(...data);
                    console.log(`📦 ${data.length} réactions récupérées (offset ${offset})`);
                    
                    if (data.length < batchSize) {
                        hasMore = false;
                        console.log(`✅ Dernière page atteinte`);
                    } else {
                        offset += batchSize;
                    }
                }
            }

            console.log(`✅ Total récupéré: ${allReactions.length} réactions`);
            return allReactions;
        },

        async loadReactions() {
            const container = document.getElementById('user-reactions-container');
            container.innerHTML = `
                <div class="loader">
                    <div class="spinner"></div>
                    <p>Chargement des réactions...</p>
                </div>`;

            try {
                // ✅ Utilisation de la pagination complète
                const reactions = await this.fetchAllReactions(this.articleId);
                this.allReactions = reactions;

                const { data: article, error: articleError } = await this.supabase
                    .from('articles')
                    .select('*, users_profile(prenom, nom)')
                    .eq('article_id', this.articleId)
                    .single();

                if (articleError) throw articleError;

                this.renderPageLayout(container, reactions, article);

            } catch (error) {
                console.error('Erreur lors du chargement des réactions:', error);
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erreur de chargement</h3>
                        <p>Impossible de charger les réactions. Vérifiez la Vue et les RLS.</p>
                    </div>`;
            }
        },

        renderPageLayout(container, reactions, article) {
            if (!reactions || reactions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-heart-broken"></i>
                        <h3>Aucune réaction</h3>
                        <p>Cet article n'a pas encore reçu de réactions.</p>
                    </div>`;
                return;
            }
            
            const reactionsByType = this.groupReactionsByType(reactions);
            const totalUsers = new Set(reactions.map(r => r.acteur_id)).size;

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
                        Résumé (${reactions.length} réactions par ${totalUsers} utilisateurs)
                    </h3>
                    <div class="reactions-stats">
                        ${this.renderReactionStat('like', 'thumbs-up', reactionsByType.like.length)}
                        ${this.renderReactionStat('love', 'heart', reactionsByType.love.length)}
                        ${this.renderReactionStat('rire', 'laugh', reactionsByType.rire.length)}
                        ${this.renderReactionStat('colere', 'angry', reactionsByType.colere.length)}
                    </div>
                </div>

                <div class="reactions-tabs">
                    <button class="tab-btn active" data-type="all"><i class="fas fa-list"></i> Toutes (${totalUsers})</button>
                    <button class="tab-btn" data-type="like"><i class="fas fa-thumbs-up"></i> J'aime (${new Set(reactionsByType.like.map(r => r.acteur_id)).size})</button>
                    <button class="tab-btn" data-type="love"><i class="fas fa-heart"></i> Amour (${new Set(reactionsByType.love.map(r => r.acteur_id)).size})</button>
                    <button class="tab-btn" data-type="rire"><i class="fas fa-laugh"></i> Rire (${new Set(reactionsByType.rire.map(r => r.acteur_id)).size})</button>
                    <button class="tab-btn" data-type="colere"><i class="fas fa-angry"></i> Colère (${new Set(reactionsByType.colere.map(r => r.acteur_id)).size})</button>
                </div>

                <div class="reactions-list" id="reactions-list"></div>
            `;
            container.innerHTML = html;
            
            this.renderGroupedUserList(reactions);
            this.initTabs();
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

        renderGroupedUserList(reactions) {
            const listContainer = document.getElementById('reactions-list');
            if (!listContainer) return;

            if (reactions.length === 0) {
                listContainer.innerHTML = `<div class="empty-state-small"><p>Aucun utilisateur dans cette catégorie.</p></div>`;
                return;
            }

            // Regrouper par utilisateur
            const usersData = {};
            reactions.forEach(reaction => {
                const acteurId = reaction.acteur_id;
                if (!usersData[acteurId]) {
                    usersData[acteurId] = {
                        prenom: reaction.prenom_acteur, 
                        nom: reaction.nom_acteur,      
                        type: reaction.type_acteur,     
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

            // Trier par date
            const sortedUsers = Object.values(usersData).sort((a, b) => b.latestDate - a.latestDate);
            
            const reactionDetails = {
                like: { icon: 'thumbs-up', color: '#3b82f6', label: 'J\'aime' },
                love: { icon: 'heart', color: '#ef4444', label: 'Amour' },
                rire: { icon: 'laugh', color: '#f59e0b', label: 'Rire' },
                colere: { icon: 'angry', color: '#dc2626', label: 'Colère' }
            };

            // Générer le HTML
            const html = sortedUsers.map(userData => {
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

        initTabs() {
            const tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    const type = tab.getAttribute('data-type');
                    let reactionsToDisplay;

                    if (type === 'all') {
                        reactionsToDisplay = this.allReactions;
                    } else {
                        reactionsToDisplay = this.allReactions.filter(r => r.reaction_type === type);
                    }
                    
                    this.renderGroupedUserList(reactionsToDisplay);
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
