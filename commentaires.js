// ============================================================================
// WIDGET COMMENTAIRES - WORLD CONNECT
// ============================================================================
// Version: 3.0.0 - Correction complète avec supabaseInstance + Admin + Edit
// Compatible avec index.html et pages standalone
// ============================================================================

'use strict';

window.CommentsWidget = {
    supabaseInstance: null,
    currentUser: null,
    userProfile: null,
    realtimeChannels: new Map(),
    editingCommentId: null,
    editingReplyId: null,
    
    // ============================================================================
    // INITIALISATION
    // ============================================================================
    
    async init() {
        console.log('🔄 [CommentsWidget] Initialisation...');
        
        if (!window.supabaseClient) {
            console.error('❌ [CommentsWidget] supabaseClient non disponible');
            return false;
        }
        
        this.supabaseInstance = window.supabaseClient.supabase;
        this.currentUser = await window.supabaseClient.getCurrentUser();
        
        if (this.currentUser) {
            this.userProfile = await window.supabaseClient.getUserProfile(this.currentUser.id);
        }
        
        console.log('✅ [CommentsWidget] Initialisé', {
            user: this.currentUser?.id,
            profile: this.userProfile?.prenom,
            role: this.userProfile?.role
        });
        
        return true;
    },
    
    // ============================================================================
    // RENDU DES COMMENTAIRES
    // ============================================================================
    
    async loadComments(articleId, container) {
        if (!this.supabaseInstance) {
            await this.init();
        }
        
        container.innerHTML = '<div class="comments-loader"><div class="spinner"></div></div>';
        
        try {
            console.log('📥 [CommentsWidget] Chargement commentaires:', articleId);
            
            const { data: comments, error: commentError } = await this.supabaseInstance
                .from('comments_with_actor_info')
                .select('*')
                .eq('article_id', articleId)
                .order('date_created', { ascending: false });
            
            if (commentError) throw commentError;
            
            const { data: allReplies, error: replyError } = await this.supabaseInstance
                .from('replies_with_actor_info')
                .select('*')
                .order('date_created', { ascending: true });
            
            if (replyError) throw replyError;
            
            const commentIds = comments.map(c => c.session_id);
            const replies = allReplies.filter(r => commentIds.includes(r.session_id));
            
            console.log('✅ [CommentsWidget] Données chargées:', {
                comments: comments?.length || 0,
                replies: replies?.length || 0
            });
            
            this.renderComments(container, articleId, comments || [], replies || []);
            this.setupRealtime(articleId, container);
            
        } catch (error) {
            console.error('❌ [CommentsWidget] Erreur chargement:', error);
            container.innerHTML = `
                <div class="comments-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Erreur de chargement des commentaires</p>
                    <button onclick="CommentsWidget.loadComments('${articleId}', document.getElementById('comments-${articleId}'))" 
                        class="retry-btn">
                        <i class="fas fa-sync-alt"></i> Réessayer
                    </button>
                </div>
            `;
        }
    },
    
    renderComments(container, articleId, comments, allReplies) {
        const repliesByComment = {};
        allReplies.forEach(reply => {
            const parentId = reply.session_id;
            if (!repliesByComment[parentId]) repliesByComment[parentId] = [];
            repliesByComment[parentId].push(reply);
        });
        
        let html = `
            <div class="comments-widget">
                <div class="comments-header">
                    <h4 class="comments-title">
                        <i class="fas fa-comments"></i>
                        Commentaires (${comments.length})
                    </h4>
                </div>
        `;
        
        if (!this.currentUser || !this.userProfile) {
            html += `
                <div class="comments-login-prompt">
                    <i class="fas fa-lock"></i>
                    <p>Connectez-vous pour commenter</p>
                    <button onclick="window.location.href='connexion.html'" class="login-btn">
                        <i class="fas fa-sign-in-alt"></i> Se connecter
                    </button>
                </div>
            `;
        } else {
            html += `
                <div class="comment-input-box">
                    <div class="comment-input-avatar">
                        ${this.getInitials(this.userProfile.prenom, this.userProfile.nom)}
                    </div>
                    <div class="comment-input-wrapper">
                        <textarea 
                            id="comment-input-${articleId}" 
                            class="comment-input"
                            placeholder="Écrivez votre commentaire..."
                            rows="3"></textarea>
                        <button 
                            onclick="CommentsWidget.submitComment('${articleId}')" 
                            class="comment-submit-btn">
                            <i class="fas fa-paper-plane"></i> Envoyer
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (comments.length === 0) {
            html += `
                <div class="comments-empty">
                    <i class="fas fa-comment-slash"></i>
                    <p>Soyez le premier à commenter !</p>
                </div>
            `;
        } else {
            html += '<div class="comments-list">';
            comments.forEach(comment => {
                html += this.renderComment(comment, repliesByComment[comment.session_id] || [], articleId);
            });
            html += '</div>';
        }
        
        html += '</div>';
        this.injectStyles();
        container.innerHTML = html;
    },
    
    renderComment(comment, replies, articleId) {
        const commentId = comment.session_id;
        const prenom = comment.prenom_acteur || 'Utilisateur';
        const nom = comment.nom_acteur || '';
        const texte = comment.texte;
        const date = comment.date_created;
        const initials = this.getInitials(prenom, nom);
        
        const isMyComment = this.currentUser && this.currentUser.id === comment.acteur_id;
        const isAdmin = this.userProfile && this.userProfile.role === 'admin';
        const canModify = isMyComment || isAdmin;
        
        let html = `
            <div class="comment-item" id="comment-${commentId}">
                <div class="comment-main">
                    <div class="comment-avatar">${initials}</div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-author">${this.escapeHtml(prenom)} ${this.escapeHtml(nom)}</span>
                            <span class="comment-date">${this.formatDate(date)}</span>
                            ${isAdmin && !isMyComment ? '<span class="admin-badge">ADMIN</span>' : ''}
                        </div>
                        <div class="comment-text" id="comment-text-${commentId}">${this.escapeHtml(texte)}</div>
                        
                        <div id="comment-edit-${commentId}" class="comment-edit-box" style="display: none;">
                            <textarea id="comment-edit-input-${commentId}" class="comment-edit-input">${this.escapeHtml(texte)}</textarea>
                            <div class="comment-edit-actions">
                                <button onclick="CommentsWidget.saveCommentEdit('${commentId}', '${articleId}')" class="save-edit-btn">
                                    <i class="fas fa-check"></i> Sauvegarder
                                </button>
                                <button onclick="CommentsWidget.cancelCommentEdit('${commentId}')" class="cancel-edit-btn">
                                    <i class="fas fa-times"></i> Annuler
                                </button>
                            </div>
                        </div>
                        
                        <div class="comment-actions">
                            ${this.currentUser ? `
                                <button class="comment-action-btn" onclick="CommentsWidget.toggleReplyBox('${commentId}')">
                                    <i class="fas fa-reply"></i> Répondre
                                </button>
                            ` : ''}
                            ${canModify ? `
                                <button class="comment-action-btn edit-btn" onclick="CommentsWidget.editComment('${commentId}')">
                                    <i class="fas fa-edit"></i> Modifier
                                </button>
                                <button class="comment-action-btn delete-btn" onclick="CommentsWidget.deleteComment('${commentId}', '${articleId}')">
                                    <i class="fas fa-trash"></i> Supprimer
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${this.currentUser ? `
                    <div id="reply-box-${commentId}" class="reply-input-box" style="display: none;">
                        <div class="reply-input-avatar">
                            ${this.getInitials(this.userProfile.prenom, this.userProfile.nom)}
                        </div>
                        <div class="reply-input-wrapper">
                            <textarea 
                                id="reply-input-${commentId}" 
                                class="reply-input"
                                placeholder="Votre réponse..."
                                rows="2"></textarea>
                            <button onclick="CommentsWidget.submitReply('${commentId}', '${articleId}')" class="reply-submit-btn">
                                <i class="fas fa-paper-plane"></i> Répondre
                            </button>
                        </div>
                    </div>
                ` : ''}
                
                ${replies.length > 0 ? `
                    <div class="replies-list">
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
        const initials = this.getInitials(prenom, nom);
        
        const isMyReply = this.currentUser && this.currentUser.id === reply.acteur_id;
        const isAdmin = this.userProfile && this.userProfile.role === 'admin';
        const canModify = isMyReply || isAdmin;
        
        return `
            <div class="reply-item" id="reply-${replyId}">
                <div class="reply-avatar">${initials}</div>
                <div class="reply-content">
                    <div class="reply-header">
                        <span class="reply-author">${this.escapeHtml(prenom)} ${this.escapeHtml(nom)}</span>
                        <span class="reply-date">${this.formatDate(date)}</span>
                        ${isAdmin && !isMyReply ? '<span class="admin-badge">ADMIN</span>' : ''}
                    </div>
                    <div class="reply-text" id="reply-text-${replyId}">${this.escapeHtml(texte)}</div>
                    
                    <div id="reply-edit-${replyId}" class="reply-edit-box" style="display: none;">
                        <textarea id="reply-edit-input-${replyId}" class="reply-edit-input">${this.escapeHtml(texte)}</textarea>
                        <div class="reply-edit-actions">
                            <button onclick="CommentsWidget.saveReplyEdit('${replyId}', '${articleId}')" class="save-edit-btn">
                                <i class="fas fa-check"></i> Sauvegarder
                            </button>
                            <button onclick="CommentsWidget.cancelReplyEdit('${replyId}')" class="cancel-edit-btn">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                        </div>
                    </div>
                    
                    ${canModify ? `
                        <div class="reply-actions">
                            <button class="reply-action-btn edit-btn" onclick="CommentsWidget.editReply('${replyId}')">
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button class="reply-action-btn delete-btn" onclick="CommentsWidget.deleteReply('${replyId}', '${articleId}')">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },
    
    // ============================================================================
    // ACTIONS - COMMENTAIRES
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
            if (container) this.loadComments(articleId, container);
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showToast('Erreur lors de l\'envoi', 'error');
        }
    },
    
    editComment(commentId) {
        const textDiv = document.getElementById(`comment-text-${commentId}`);
        const editDiv = document.getElementById(`comment-edit-${commentId}`);
        
        if (textDiv && editDiv) {
            textDiv.style.display = 'none';
            editDiv.style.display = 'block';
            document.getElementById(`comment-edit-input-${commentId}`)?.focus();
        }
    },
    
    async saveCommentEdit(commentId, articleId) {
        const input = document.getElementById(`comment-edit-input-${commentId}`);
        const texte = input.value.trim();
        
        if (!texte) {
            this.showToast('Le commentaire ne peut pas être vide', 'warning');
            return;
        }
        
        try {
            const { error } = await this.supabaseInstance
                .from('sessions_commentaires')
                .update({ texte: texte })
                .eq('session_id', commentId);
            
            if (error) throw error;
            
            this.showToast('Commentaire modifié', 'success');
            const container = document.getElementById(`comments-${articleId}`);
            if (container) this.loadComments(articleId, container);
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showToast('Erreur lors de la modification', 'error');
        }
    },
    
    cancelCommentEdit(commentId) {
        const textDiv = document.getElementById(`comment-text-${commentId}`);
        const editDiv = document.getElementById(`comment-edit-${commentId}`);
        
        if (textDiv && editDiv) {
            textDiv.style.display = 'block';
            editDiv.style.display = 'none';
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
            if (container) this.loadComments(articleId, container);
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showToast('Erreur', 'error');
        }
    },
    
    // ============================================================================
    // ACTIONS - RÉPONSES
    // ============================================================================
    
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
            if (container) this.loadComments(articleId, container);
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showToast('Erreur', 'error');
        }
    },
    
    editReply(replyId) {
        const textDiv = document.getElementById(`reply-text-${replyId}`);
        const editDiv = document.getElementById(`reply-edit-${replyId}`);
        
        if (textDiv && editDiv) {
            textDiv.style.display = 'none';
            editDiv.style.display = 'block';
            document.getElementById(`reply-edit-input-${replyId}`)?.focus();
        }
    },
    
    async saveReplyEdit(replyId, articleId) {
        const input = document.getElementById(`reply-edit-input-${replyId}`);
        const texte = input.value.trim();
        
        if (!texte) {
            this.showToast('La réponse ne peut pas être vide', 'warning');
            return;
        }
        
        try {
            const { error } = await this.supabaseInstance
                .from('session_reponses')
                .update({ texte: texte })
                .eq('reponse_id', replyId);
            
            if (error) throw error;
            
            this.showToast('Réponse modifiée', 'success');
            const container = document.getElementById(`comments-${articleId}`);
            if (container) this.loadComments(articleId, container);
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showToast('Erreur', 'error');
        }
    },
    
    cancelReplyEdit(replyId) {
        const textDiv = document.getElementById(`reply-text-${replyId}`);
        const editDiv = document.getElementById(`reply-edit-${replyId}`);
        
        if (textDiv && editDiv) {
            textDiv.style.display = 'block';
            editDiv.style.display = 'none';
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
            if (container) this.loadComments(articleId, container);
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showToast('Erreur', 'error');
        }
    },
    
    toggleReplyBox(commentId) {
        const box = document.getElementById(`reply-box-${commentId}`);
        if (box) {
            const isVisible = box.style.display !== 'none';
            box.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) document.getElementById(`reply-input-${commentId}`)?.focus();
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
            }, () => this.loadComments(articleId, container))
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'session_reponses'
            }, () => this.loadComments(articleId, container))
            .subscribe();
        
        this.realtimeChannels.set(articleId, channel);
    },
    
    // ============================================================================
    // UTILITAIRES
    // ============================================================================
    
    getInitials(prenom, nom) {
        return ((prenom || 'U')[0] + (nom || '')[0]).toUpperCase();
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const diff = Date.now() - date;
        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
        if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
        if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)}j`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
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
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },
    
    injectStyles() {
        if (document.getElementById('comments-widget-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'comments-widget-styles';
        style.textContent = `
.comments-widget{padding:20px;background:var(--bg-secondary)}
.comments-header{margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid var(--border-color)}
.comments-title{font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px}
.comments-title i{color:var(--accent-blue)}
.admin-badge{background:linear-gradient(135deg,var(--accent-purple),var(--accent-pink));color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;margin-left:8px}
.comments-login-prompt{text-align:center;padding:40px 20px;background:var(--bg-primary);border-radius:16px;margin-bottom:20px}
.comments-login-prompt i{font-size:48px;color:var(--text-tertiary);margin-bottom:16px}
.comments-login-prompt p{color:var(--text-secondary);margin-bottom:20px;font-size:15px}
.login-btn{padding:12px 24px;background:var(--accent-kaki);color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:600;font-size:15px;transition:all .3s;box-shadow:0 4px 12px rgba(107,114,73,.3)}
.login-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(107,114,73,.5)}
.comment-input-box,.reply-input-box{display:flex;gap:12px;margin-bottom:24px;padding:16px;background:var(--bg-primary);border-radius:16px}
.comment-input-avatar,.reply-input-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--accent-blue),var(--accent-cyan));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;flex-shrink:0}
.reply-input-avatar{width:40px;height:40px;font-size:16px}
.comment-input-wrapper,.reply-input-wrapper{flex:1;display:flex;flex-direction:column;gap:10px}
.comment-input,.reply-input{width:100%;padding:12px 16px;border:2px solid var(--border-color);border-radius:12px;font-family:inherit;font-size:14px;color:var(--text-primary);background:var(--bg-secondary);resize:vertical;transition:all .3s}
.comment-input:focus,.reply-input:focus{outline:0;border-color:var(--accent-blue);box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.comment-submit-btn,.reply-submit-btn{align-self:flex-end;padding:10px 20px;background:var(--accent-kaki);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;transition:all .3s;box-shadow:0 3px 10px rgba(107,114,73,.3)}
.comment-submit-btn:hover,.reply-submit-btn:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(107,114,73,.5)}
.comments-empty{text-align:center;padding:60px 20px;color:var(--text-tertiary)}
.comments-empty i{font-size:64px;margin-bottom:16px;opacity:.5}
.comments-list{display:flex;flex-direction:column;gap:16px}
.comment-item{padding:16px;background:var(--bg-primary);border-radius:16px;border-left:4px solid var(--accent-blue);transition:all .3s}
.comment-item:hover{box-shadow:0 4px 12px rgba(0,0,0,.1);transform:translateX(4px)}
.comment-main{display:flex;gap:12px}
.comment-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--accent-blue),var(--accent-cyan));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;flex-shrink:0}
.comment-content{flex:1;min-width:0}
.comment-header{display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap}
.comment-author{font-weight:700;font-size:15px;color:var(--text-primary)}
.comment-date{font-size:13px;color:var(--text-tertiary)}
.comment-text{color:var(--text-primary);line-height:1.6;font-size:14px;margin-bottom:10px;word-wrap:break-word}
.comment-edit-box,.reply-edit-box{margin-bottom:10px}
.comment-edit-input,.reply-edit-input{width:100%;padding:12px 16px;border:2px solid var(--accent-blue);border-radius:12px;font-family:inherit;font-size:14px;color:var(--text-primary);background:var(--bg-secondary);resize:vertical;min-height:80px;transition:all .3s}
.comment-edit-input:focus,.reply-edit-input:focus{outline:0;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.comment-edit-actions,.reply-edit-actions{display:flex;gap:10px;margin-top:10px}
.save-edit-btn{padding:8px 16px;background:var(--accent-green);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;transition:all .3s;display:flex;align-items:center;gap:6px}
.save-edit-btn:hover{background:#059669;transform:translateY(-2px);box-shadow:0 4px 12px rgba(16,185,129,.4)}
.cancel-edit-btn{padding:8px 16px;background:var(--text-tertiary);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;transition:all .3s;display:flex;align-items:center;gap:6px}
.cancel-edit-btn:hover{background:var(--text-secondary);transform:translateY(-2px)}
.comment-actions,.reply-actions{display:flex;gap:16px;flex-wrap:wrap}
.comment-action-btn,.reply-action-btn{background:0 0;border:none;color:var(--accent-blue);cursor:pointer;font-size:13px;font-weight:600;padding:6px 0;transition:all .3s;display:flex;align-items:center;gap:5px}
.comment-action-btn:hover,.reply-action-btn:hover{color:var(--accent-cyan);transform:scale(1.05)}
.comment-action-btn.edit-btn,.reply-action-btn.edit-btn{color:var(--accent-orange)}
.comment-action-btn.edit-btn:hover,.reply-action-btn.edit-btn:hover{color:#ea580c}
.comment-action-btn.delete-btn,.reply-action-btn.delete-btn{color:var(--accent-red)}
.comment-action-btn.delete-btn:hover,.reply-action-btn.delete-btn:hover{color:#dc2626}
.reply-input-box{margin:12px 0 0 60px;padding:12px}
.replies-list{margin-top:16px;margin-left:60px;padding-left:20px;border-left:3px solid var(--border-color);display:flex;flex-direction:column;gap:12px}
.reply-item{display:flex;gap:10px;padding:12px;background:var(--bg-secondary);border-radius:12px;transition:all .3s}
.reply-item:hover{background:var(--bg-primary);transform:translateX(4px)}
.reply-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent-purple),var(--accent-pink));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0}
.reply-content{flex:1;min-width:0}
.reply-header{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.reply-author{font-weight:600;font-size:14px;color:var(--text-primary)}
.reply-date{font-size:12px;color:var(--text-tertiary)}
.reply-text{color:var(--text-primary);line-height:1.5;font-size:13px;word-wrap:break-word;margin-bottom:8px}
.reply-actions{display:flex;gap:12px;margin-top:6px}
.comments-loader{text-align:center;padding:40px}
.comments-error{text-align:center;padding:40px 20px;color:var(--text-tertiary)}
.comments-error i{font-size:48px;color:var(--accent-red);margin-bottom:16px}
.retry-btn{margin-top:16px;padding:10px 20px;background:var(--accent-kaki);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:600;transition:all .3s}
.retry-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(107,114,73,.4)}
@media (max-width:768px){
.comment-item{padding:12px}
.replies-list{margin-left:40px;padding-left:12px}
.reply-input-box{margin-left:40px}
.comment-avatar{width:40px;height:40px;font-size:16px}
.reply-avatar{width:32px;height:32px;font-size:13px}
.comment-input-avatar,.reply-input-avatar{width:40px;height:40px;font-size:16px}
}
        `;
        document.head.appendChild(style);
    },
    
    cleanup() {
        this.realtimeChannels.forEach((channel) => {
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
        if (window.supabaseClient) window.CommentsWidget.init();
    });
} else {
    if (window.supabaseClient) window.CommentsWidget.init();
}

window.addEventListener('beforeunload', () => window.CommentsWidget.cleanup());

console.log('✅ [CommentsWidget] Module chargé - Version 3.0.0 PRO');

// ============================================================================
// EXPORTS POUR COMPATIBILITÉ
// ============================================================================

if (!window.loadComments) {
    window.loadComments = (articleId, container) => window.CommentsWidget.loadComments(articleId, container);
}

if (!window.submitComment) {
    window.submitComment = (articleId) => window.CommentsWidget.submitComment(articleId);
}

if (!window.submitReply) {
    window.submitReply = (parentId, articleId) => window.CommentsWidget.submitReply(parentId, articleId);
}

if (!window.deleteComment) {
    window.deleteComment = (commentId, articleId) => window.CommentsWidget.deleteComment(commentId, articleId);
}

if (!window.toggleReplyBox) {
    window.toggleReplyBox = (commentId) => window.CommentsWidget.toggleReplyBox(commentId);
}

if (!window.editComment) {
    window.editComment = (commentId) => window.CommentsWidget.editComment(commentId);
}

if (!window.saveCommentEdit) {
    window.saveCommentEdit = (commentId, articleId) => window.CommentsWidget.saveCommentEdit(commentId, articleId);
}

if (!window.cancelCommentEdit) {
    window.cancelCommentEdit = (commentId) => window.CommentsWidget.cancelCommentEdit(commentId);
}

if (!window.editReply) {
    window.editReply = (replyId) => window.CommentsWidget.editReply(replyId);
}

if (!window.saveReplyEdit) {
    window.saveReplyEdit = (replyId, articleId) => window.CommentsWidget.saveReplyEdit(replyId, articleId);
}

if (!window.cancelReplyEdit) {
    window.cancelReplyEdit = (replyId) => window.CommentsWidget.cancelReplyEdit(replyId);
}

if (!window.deleteReply) {
    window.deleteReply = (replyId, articleId) => window.CommentsWidget.deleteReply(replyId, articleId);
}
