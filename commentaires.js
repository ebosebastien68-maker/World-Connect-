Voici le **fichier `commentaires.js` corrigé et simplifié** qui fonctionnera avec votre HTML actuel :

```javascript
// ============================================================================
// WIDGET COMMENTAIRES - WORLD CONNECT v3.0 - VERSION CORRIGÉE
// ============================================================================

'use strict';

window.CommentsWidget = {
    supabaseInstance: null,
    currentUser: null,
    userProfile: null,
    realtimeChannels: new Map(),
    
    // ============================================================================
    // INITIALISATION
    // ============================================================================
    
    async init() {
        console.log('🔄 [CommentsWidget v3.0] Initialisation...');
        
        if (!window.supabaseClient) {
            console.error('❌ [CommentsWidget] supabaseClient non disponible');
            return false;
        }
        
        this.supabaseInstance = window.supabaseClient.supabase;
        this.currentUser = await window.supabaseClient.getCurrentUser();
        
        if (this.currentUser) {
            this.userProfile = await window.supabaseClient.getUserProfile(this.currentUser.id);
            console.log('👤 [CommentsWidget] Utilisateur:', {
                id: this.currentUser.id,
                nom: `${this.userProfile?.prenom} ${this.userProfile?.nom}`,
                role: this.userProfile?.role
            });
        }
        
        // ✅ Injecter les styles et la modal immédiatement
        this.injectStyles();
        this.injectModal();
        
        console.log('✅ [CommentsWidget] Initialisé');
        return true;
    },
    
    // ============================================================================
    // CHARGEMENT ET AFFICHAGE DES COMMENTAIRES
    // ============================================================================
    
    async loadComments(articleId, container) {
        if (!this.supabaseInstance) {
            await this.init();
        }
        
        container.innerHTML = '<div class="comments-loader"><div class="spinner"></div></div>';
        
        try {
            console.log('📥 [CommentsWidget] Chargement commentaires:', articleId);
            
            // Récupérer les commentaires
            const { data: comments, error: commentError } = await this.supabaseInstance
                .from('comments_with_actor_info')
                .select('*')
                .eq('article_id', articleId)
                .order('date_created', { ascending: false });
            
            if (commentError) throw commentError;
            
            // Récupérer les réponses
            const { data: allReplies, error: replyError } = await this.supabaseInstance
                .from('replies_with_actor_info')
                .select('*')
                .order('date_created', { ascending: true });
            
            if (replyError) throw replyError;
            
            // Filtrer les réponses qui appartiennent aux commentaires de cet article
            const commentIds = (comments || []).map(c => c.session_id);
            const replies = (allReplies || []).filter(r => commentIds.includes(r.session_id));
            
            console.log('✅ [CommentsWidget] Données chargées:', {
                comments: comments?.length || 0,
                replies: replies?.length || 0
            });
            
            // Rendu
            this.renderComments(container, articleId, comments || [], replies || []);
            
            // Activer le temps réel
            this.setupRealtime(articleId, container);
            
        } catch (error) {
            console.error('❌ [CommentsWidget] Erreur chargement:', error);
            container.innerHTML = `
                <div class="comments-error" style="padding: 20px; text-align: center; color: var(--text-tertiary);">
                    <i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 12px;"></i>
                    <p>Erreur de chargement des commentaires</p>
                    <button onclick="CommentsWidget.loadComments('${articleId}', document.getElementById('comments-${articleId}'))" 
                        style="margin-top: 12px; padding: 10px 20px; background: var(--accent-kaki); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-sync-alt"></i> Réessayer
                    </button>
                </div>
            `;
        }
    },
    
    renderComments(container, articleId, comments, allReplies) {
        // Grouper les réponses par commentaire parent
        const repliesByComment = {};
        allReplies.forEach(reply => {
            const parentId = reply.session_id;
            if (!repliesByComment[parentId]) repliesByComment[parentId] = [];
            repliesByComment[parentId].push(reply);
        });
        
        let html = `
            <div class="comments-widget" style="padding: 20px; border-top: 1px solid var(--border-color);">
                <div class="comments-header" style="margin-bottom: 20px;">
                    <h4 style="font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: var(--text-primary);">
                        <i class="fas fa-comments" style="color: var(--accent-blue);"></i>
                        Commentaires (${comments.length})
                    </h4>
                </div>
        `;
        
        // Section d'ajout de commentaire
        if (!this.currentUser || !this.userProfile) {
            html += `
                <div style="text-align: center; padding: 30px; background: var(--bg-primary); border-radius: 12px; margin-bottom: 20px;">
                    <i class="fas fa-lock" style="font-size: 32px; color: var(--text-tertiary); margin-bottom: 12px;"></i>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">Connectez-vous pour commenter</p>
                    <button onclick="window.location.href='connexion.html'" 
                        style="padding: 10px 20px; background: var(--accent-kaki); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-sign-in-alt"></i> Se connecter
                    </button>
                </div>
            `;
        } else {
            const initials = this.getInitials(this.userProfile.prenom, this.userProfile.nom);
            html += `
                <div style="display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; flex-shrink: 0;">
                        ${initials}
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                        <textarea 
                            id="comment-input-${articleId}" 
                            placeholder="Écrivez votre commentaire..."
                            style="width: 100%; padding: 12px 16px; border: 2px solid var(--border-color); border-radius: 12px; font-family: inherit; font-size: 14px; color: var(--text-primary); background: var(--bg-secondary); resize: vertical; min-height: 60px;"
                            rows="3"></textarea>
                        <button 
                            onclick="CommentsWidget.submitComment('${articleId}')" 
                            style="align-self: flex-end; padding: 10px 20px; background: var(--accent-kaki); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; box-shadow: 0 3px 10px rgba(107, 114, 73, 0.3);">
                            <i class="fas fa-paper-plane"></i> Envoyer
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Liste des commentaires
        if (comments.length === 0) {
            html += `
                <div style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <i class="fas fa-comment-slash" style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;"></i>
                    <p>Soyez le premier à commenter !</p>
                </div>
            `;
        } else {
            html += '<div style="display: flex; flex-direction: column; gap: 16px;">';
            
            comments.forEach(comment => {
                html += this.renderComment(comment, repliesByComment[comment.session_id] || [], articleId);
            });
            
            html += '</div>';
        }
        
        html += '</div>';
        
        container.innerHTML = html;
    },
    
    renderComment(comment, replies, articleId) {
        const commentId = comment.session_id;
        const prenom = comment.prenom_acteur || 'Utilisateur';
        const nom = comment.nom_acteur || '';
        const texte = comment.texte;
        const date = comment.date_created;
        const acteurId = comment.acteur_id;
        const initials = this.getInitials(prenom, nom);
        
        // ✅ Vérification propriétaire OU admin
        const isMyComment = this.currentUser && this.currentUser.id === acteurId;
        const isAdmin = this.userProfile && this.userProfile.role === 'admin';
        const canModify = isMyComment;
        const canDelete = isMyComment || isAdmin;
        
        let html = `
            <div style="padding: 16px; background: var(--bg-primary); border-radius: 12px; border-left: 4px solid var(--accent-blue);" id="comment-${commentId}">
                <div style="display: flex; gap: 12px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; flex-shrink: 0;">
                        ${initials}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <span style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${this.escapeHtml(prenom)} ${this.escapeHtml(nom)}</span>
                            <span style="font-size: 13px; color: var(--text-tertiary);">${this.formatDate(date)}</span>
                        </div>
                        <div style="color: var(--text-primary); line-height: 1.6; font-size: 14px; margin-bottom: 10px; word-wrap: break-word;">
                            ${this.escapeHtml(texte)}
                        </div>
                        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                            ${this.currentUser ? `
                                <button onclick="CommentsWidget.toggleReplyBox('${commentId}')" 
                                    style="background: none; border: none; color: var(--accent-blue); cursor: pointer; font-size: 13px; font-weight: 600; padding: 6px 0;">
                                    <i class="fas fa-reply"></i> Répondre
                                </button>
                            ` : ''}
                            ${canModify ? `
                                <button onclick="CommentsWidget.openEditModal('comment', '${commentId}', '${articleId}')" 
                                    style="background: none; border: none; color: var(--accent-purple); cursor: pointer; font-size: 13px; font-weight: 600; padding: 6px 0;">
                                    <i class="fas fa-edit"></i> Modifier
                                </button>
                            ` : ''}
                            ${canDelete ? `
                                <button onclick="CommentsWidget.deleteComment('${commentId}', '${articleId}')" 
                                    style="background: none; border: none; color: var(--accent-red); cursor: pointer; font-size: 13px; font-weight: 600; padding: 6px 0;">
                                    <i class="fas fa-trash"></i> Supprimer
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${this.currentUser ? `
                    <div id="reply-box-${commentId}" style="display: none; margin: 12px 0 0 60px; padding: 12px; background: var(--bg-secondary); border-radius: 12px;">
                        <div style="display: flex; gap: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; flex-shrink: 0;">
                                ${this.getInitials(this.userProfile.prenom, this.userProfile.nom)}
                            </div>
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                                <textarea 
                                    id="reply-input-${commentId}" 
                                    placeholder="Votre réponse..."
                                    style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 12px; font-family: inherit; font-size: 13px; color: var(--text-primary); background: var(--bg-primary); resize: vertical; min-height: 50px;"
                                    rows="2"></textarea>
                                <button onclick="CommentsWidget.submitReply('${commentId}', '${articleId}')" 
                                    style="align-self: flex-end; padding: 8px 16px; background: var(--accent-kaki); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;">
                                    <i class="fas fa-paper-plane"></i> Répondre
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${replies.length > 0 ? `
                    <div style="margin-top: 16px; margin-left: 60px; padding-left: 20px; border-left: 3px solid var(--border-color); display: flex; flex-direction: column; gap: 12px;">
                        ${replies.map(reply => this.renderReply(reply, articleId)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        return html;
    },
    
    renderReply(reply, articleId) {
        const replyId = reply.reponse_id;
        const prenom = reply.prenom_acteur || 'Utilisateur';
        const nom = reply.nom_acteur || '';
        const texte = reply.texte;
        const date = reply.date_created;
        const acteurId = reply.acteur_id;
        const initials = this.getInitials(prenom, nom);
        
        // ✅ Vérification propriétaire OU admin
        const isMyReply = this.currentUser && this.currentUser.id === acteurId;
        const isAdmin = this.userProfile && this.userProfile.role === 'admin';
        const canModify = isMyReply;
        const canDelete = isMyReply || isAdmin;
        
        return `
            <div id="reply-${replyId}" style="display: flex; gap: 10px; padding: 12px; background: var(--bg-secondary); border-radius: 12px;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0;">
                    ${initials}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${this.escapeHtml(prenom)} ${this.escapeHtml(nom)}</span>
                        <span style="font-size: 12px; color: var(--text-tertiary);">${this.formatDate(date)}</span>
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.5; font-size: 13px; word-wrap: break-word; margin-bottom: 8px;">
                        ${this.escapeHtml(texte)}
                    </div>
                    ${(canModify || canDelete) ? `
                        <div style="display: flex; gap: 12px;">
                            ${canModify ? `
                                <button onclick="CommentsWidget.openEditModal('reply', '${replyId}', '${articleId}')" 
                                    style="background: none; border: none; color: var(--accent-purple); cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 0;">
                                    <i class="fas fa-edit"></i> Modifier
                                </button>
                            ` : ''}
                            ${canDelete ? `
                                <button onclick="CommentsWidget.deleteReply('${replyId}', '${articleId}')" 
                                    style="background: none; border: none; color: var(--accent-red); cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 0;">
                                    <i class="fas fa-trash"></i> Supprimer
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },
    
    // ============================================================================
    // ACTIONS UTILISATEUR
    // ============================================================================
    
    async submitComment(articleId) {
        if (!this.currentUser || !this.userProfile) {
            this.showToast('Connexion requise', 'error');
            return;
        }
        
        const input = document.getElementById(`comment-input-${articleId}`);
        const texte = input.value.trim();
        
        if (!texte) {
            this.showToast('Le commentaire ne peut pas être vide', 'warning');
            return;
        }
        
        try {
            const { error } = await this.supabaseInstance
                .from('sessions_commentaires')
                .insert([{
                    article_id: articleId,
                    user_id: this.currentUser.id,
                    texte: texte
                }]);
            
            if (error) throw error;
            
            input.value = '';
            this.showToast('Commentaire publié', 'success');
            
            const container = document.getElementById(`comments-${articleId}`);
            if (container) {
                this.loadComments(articleId, container);
            }
            
        } catch (error) {
            console.error('❌ Erreur envoi commentaire:', error);
            this.showToast('Erreur lors de l\'envoi', 'error');
        }
    },
    
    async submitReply(parentId, articleId) {
        if (!this.currentUser || !this.userProfile) {
            this.showToast('Connexion requise', 'error');
            return;
        }
        
        const input = document.getElementById(`reply-input-${parentId}`);
        const texte = input.value.trim();
        
        if (!texte) {
            this.showToast('La réponse ne peut pas être vide', 'warning');
            return;
        }
        
        try {
            const { error } = await this.supabaseInstance
                .from('session_reponses')
                .insert([{
                    session_id: parentId,
                    user_id: this.currentUser.id,
                    texte: texte
                }]);
            
            if (error) throw error;
            
            input.value = '';
            this.toggleReplyBox(parentId);
            this.showToast('Réponse publiée', 'success');
            
            const container = document.getElementById(`comments-${articleId}`);
            if (container) {
                this.loadComments(articleId, container);
            }
            
        } catch (error) {
            console.error('❌ Erreur envoi réponse:', error);
            this.showToast('Erreur lors de l\'envoi', 'error');
        }
    },
    
    async deleteComment(commentId, articleId) {
        if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
        
        try {
            const { error } = await this.supabaseInstance
                .from('sessions_commentaires')
                .delete()
                .eq('session_id', commentId);
            
            if (error) throw error;
            
            this.showToast('Commentaire supprimé', 'success');
            
            const container = document.getElementById(`comments-${articleId}`);
            if (container) {
                this.loadComments(articleId, container);
            }
            
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            this.showToast('Erreur lors de la suppression', 'error');
        }
    },
    
    async deleteReply(replyId, articleId) {
        if (!confirm("Voulez-vous vraiment supprimer cette réponse ?")) return;
        
        try {
            const { error } = await this.supabaseInstance
                .from('session_reponses')
                .delete()
                .eq('reponse_id', replyId);
            
            if (error) throw error;
            
            this.showToast('Réponse supprimée', 'success');
            
            const container = document.getElementById(`comments-${articleId}`);
            if (container) {
                this.loadComments(articleId, container);
            }
            
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            this.showToast('Erreur lors de la suppression', 'error');
        }
    },
    
    toggleReplyBox(commentId) {
        const box = document.getElementById(`reply-box-${commentId}`);
        if (box) {
            const isVisible = box.style.display !== 'none';
            box.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                const input = document.getElementById(`reply-input-${commentId}`);
                if (input) input.focus();
            }
        }
    },
    
    // ============================================================================
    // MODAL D'ÉDITION
    // ============================================================================
    
    async openEditModal(type, id, articleId) {
        const modal = document.getElementById('edit-modal');
        const overlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalTextarea = document.getElementById('modal-textarea');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modal || !overlay) {
            console.error('❌ Modal introuvable');
            return;
        }
        
        try {
            let currentText = '';
            
            if (type === 'comment') {
                const { data, error } = await this.supabaseInstance
                    .from('comments_with_actor_info')
                    .select('texte')
                    .eq('session_id', id)
                    .single();
                
                if (error) throw error;
                currentText = data.texte;
                modalTitle.textContent = 'Modifier le commentaire';
                
            } else if (type === 'reply') {
                const { data, error } = await this.supabaseInstance
                    .from('replies_with_actor_info')
                    .select('texte')
                    .eq('reponse_id', id)
                    .single();
                
                if (error) throw error;
                currentText = data.texte;
                modalTitle.textContent = 'Modifier la réponse';
            }
            
            modalTextarea.value = currentText;
            saveBtn.onclick = () => this.saveEdit(type, id, articleId);
            
            overlay.classList.add('show');
            modal.classList.add('show');
            modalTextarea.focus();
            
        } catch (error) {
            console.error('❌ Erreur ouverture modal:', error);
            this.showToast('Erreur de chargement', 'error');
        }
    },
    
    closeEditModal() {
        const modal = document.getElementById('edit-modal');
        const overlay = document.getElementById('modal-overlay');
        
        if (modal && overlay) {
            modal.classList.remove('show');
            overlay.classList.remove('show');
        }
    },
    
    async saveEdit(type, id, articleId) {
        const modalTextarea = document.getElementById('modal-textarea');
        const newText = modalTextarea.value.trim();
        
        if (!newText) {
            this.showToast('Le texte ne peut pas être vide', 'warning');
            return;
        }
        
        try {
            if (type === 'comment') {
                const { error } = await this.supabaseInstance
                    .from('sessions_commentaires')
                    .update({ texte: newText })
                    .eq('session_id', id)
                    .eq('user_id', this.currentUser.id);
                
                if (error) throw error;
                this.showToast('Commentaire modifié', 'success');
                
            } else if (type === 'reply') {
                const { error } = await this.supabaseInstance
                    .from('session_reponses')
                    .update({ texte: newText })
                    .eq('reponse_id', id)
                    .eq('user_id', this.currentUser.id);
                
                if (error) throw error;
                this.showToast('Réponse modifiée', 'success');
            }
            
            this.closeEditModal();
            
            const container = document.getElementById(`comments-${articleId}`);
            if (container) {
                this.loadComments(articleId, container);
            }
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            this.showToast('Erreur lors de la modification', 'error');
        }
    },
    
    // ============================================================================
    // TEMPS RÉEL
    // ============================================================================
    
    setupRealtime(articleId, container) {
        if (this.realtimeChannels.has(articleId)) {
            this.supabaseInstance.removeChannel(this.realtimeChannels.get(articleId));
        }
        
        const channel = this.supabaseInstance
            .channel(`comments:${articleId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'sessions_commentaires',
                filter: `article_id=eq.${articleId}`
            }, () => {
                this.loadComments(articleId, container);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'session_reponses'
            }, () => {
                this.loadComments(articleId, container);
            })
            .subscribe();
        
        this.realtimeChannels.set(articleId, channel);
    },
    
    // ============================================================================
    // UTILITAIRES
    // ============================================================================
    
    getInitials(prenom, nom) {
        const p = (prenom || 'U')[0].toUpperCase();
        const n = (nom || '')[0]?.toUpperCase() || '';
        return p + n;
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `Il y a ${minutes} min`;
        }
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `Il y a ${hours}h`;
        }
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `Il y a ${days}j`;
        }
        
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    showToast(message, type = 'info') {
        if (window.ToastManager) {
            window.ToastManager[type]('Commentaires', message);
        } else {
            console.log(`[CommentsWidget] ${type.toUpperCase()}: ${message}`);
        }
    },
    
    injectStyles() {
        if (document.getElementById('comments-widget-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'comments-widget-styles';
        ```javascript
        style.textContent = `
            /* STYLES POUR LE WIDGET DE COMMENTAIRES */
            .comments-loader {
                text-align: center;
                padding: 40px;
            }
            
            .comments-loader .spinner {
                border: 4px solid var(--border-color);
                border-top: 4px solid var(--accent-blue);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* MODAL D'ÉDITION */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(8px);
                z-index: 9998;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal-overlay.show {
                display: block;
                opacity: 1;
            }
            
            .edit-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                background: var(--bg-secondary);
                border-radius: 24px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                max-width: 600px;
                width: 90%;
                padding: 32px;
                display: none;
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                border: 2px solid var(--border-color);
            }
            
            .edit-modal.show {
                display: block;
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            
            .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 24px;
            }
            
            .modal-title {
                font-size: 22px;
                font-weight: 700;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .modal-title i {
                color: var(--accent-purple);
            }
            
            .modal-close-btn {
                background: none;
                border: none;
                font-size: 24px;
                color: var(--text-tertiary);
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .modal-close-btn:hover {
                background: var(--bg-primary);
                color: var(--text-primary);
                transform: rotate(90deg);
            }
            
            .modal-body {
                margin-bottom: 24px;
            }
            
            .modal-textarea {
                width: 100%;
                min-height: 150px;
                padding: 16px;
                border: 2px solid var(--border-color);
                border-radius: 16px;
                font-family: inherit;
                font-size: 15px;
                color: var(--text-primary);
                background: var(--bg-primary);
                resize: vertical;
                transition: all 0.3s ease;
            }
            
            .modal-textarea:focus {
                outline: none;
                border-color: var(--accent-purple);
                box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
            }
            
            .modal-footer {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            
            .modal-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-weight: 600;
                font-size: 15px;
                transition: all 0.3s ease;
                font-family: inherit;
            }
            
            .modal-cancel-btn {
                background: var(--bg-primary);
                color: var(--text-primary);
            }
            
            .modal-cancel-btn:hover {
                background: var(--border-color);
            }
            
            .modal-save-btn {
                background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
                color: white;
                box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
            }
            
            .modal-save-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6);
            }
            
            @media (max-width: 768px) {
                .edit-modal {
                    padding: 24px;
                    width: 95%;
                }
                
                .modal-title {
                    font-size: 18px;
                }
                
                .modal-textarea {
                    min-height: 120px;
                }
            }
        `;
        
        document.head.appendChild(style);
    },
    
    injectModal() {
        if (document.getElementById('edit-modal')) return;
        
        const modalHTML = `
            <div class="modal-overlay" id="modal-overlay" onclick="CommentsWidget.closeEditModal()"></div>
            <div class="edit-modal" id="edit-modal">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-title">
                        <i class="fas fa-edit"></i>
                        Modifier
                    </h3>
                    <button class="modal-close-btn" onclick="CommentsWidget.closeEditModal()">
                        ×
                    </button>
                </div>
                <div class="modal-body">
                    <textarea 
                        id="modal-textarea" 
                        class="modal-textarea"
                        placeholder="Modifiez votre texte..."></textarea>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-cancel-btn" onclick="CommentsWidget.closeEditModal()">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                    <button class="modal-btn modal-save-btn" id="modal-save-btn">
                        <i class="fas fa-check"></i> Enregistrer
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },
    
    cleanup() {
        this.realtimeChannels.forEach((channel, articleId) => {
            this.supabaseInstance.removeChannel(channel);
        });
        this.realtimeChannels.clear();
    }
};

// ============================================================================
// AUTO-INITIALISATION
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.supabaseClient) {
            window.CommentsWidget.init();
        }
    });
} else {
    if (window.supabaseClient) {
        window.CommentsWidget.init();
    }
}

window.addEventListener('beforeunload', () => {
    window.CommentsWidget.cleanup();
});

// ============================================================================
// EXPORTS GLOBAUX (pour compatibilité avec l'ancien code)
// ============================================================================

window.loadComments = function(articleId, container) {
    window.CommentsWidget.loadComments(articleId, container);
};

window.submitComment = function(articleId) {
    window.CommentsWidget.submitComment(articleId);
};

window.submitReply = function(parentId, articleId) {
    window.CommentsWidget.submitReply(parentId, articleId);
};

window.deleteComment = function(commentId, articleId) {
    window.CommentsWidget.deleteComment(commentId, articleId);
};

window.deleteReply = function(replyId, articleId) {
    window.CommentsWidget.deleteReply(replyId, articleId);
};

window.toggleReplyBox = function(commentId) {
    window.CommentsWidget.toggleReplyBox(commentId);
};

console.log('✅ [CommentsWidget v3.0] Module chargé - Version corrigée');
