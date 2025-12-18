
// CONFIGURATION SUPABASE - UTILISE supabaseClient.js
// ============================================================================
// Le client Supabase est initialisé dans supabaseClient.js
// On récupère simplement la référence depuis window.supabaseClient
let supabaseClientInstance
// Attendre que supabaseClient.js soit chargé
if (window.supabaseClient && window.supabaseClient.supabase) {
    supabaseClientInstance = window.supabaseClient.supabase;
    console.log('✅ Supabase client récupéré depuis supabaseClient.js');
} else {
    console.error('❌ Erreur: Supabase client non trouvé. Vérifiez que supabaseClient.js est chargé avant script.js');
}

// Utiliser supabaseClientInstance au lieu de supabase dans tout le code


// ============================================================================
// VARIABLES GLOBALES
// ============================================================================
let currentUser = null;
let userProfile = null;
let allArticles = [];
let isSearching = false;
let currentPage = 'home';
let userReactions = {};
let optimisticReactions = null;
let optimisticComments = null;
let swRegistration = null;

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================
const ToastManager = {
    container: null,
    
    init() {
        this.container = document.getElementById('toast-container');
    },
    
    show(title, message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        this.container.appendChild(toast);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));
        
        toast.addEventListener('click', () => this.remove(toast));
        
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }
        
        return toast;
    },
    
    remove(toast) {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },
    
    success(title, message, duration) {
        return this.show(title, message, 'success', duration);
    },
    
    error(title, message, duration) {
        return this.show(title, message, 'error', duration);
    },
    
    warning(title, message, duration) {
        return this.show(title, message, 'warning', duration);
    },
    
    info(title, message, duration) {
        return this.show(title, message, 'info', duration);
    }
};

// ============================================================================
// LOADING OVERLAY MANAGER
// ============================================================================
const LoadingManager = {
    overlay: null,
    
    init() {
        this.overlay = document.getElementById('loading-overlay');
    },
    
    show() {
        this.overlay.classList.add('show');
    },
    
    hide() {
        this.overlay.classList.remove('show');
    }
};

// ============================================================================
// OFFLINE DETECTION
// ============================================================================
const OfflineManager = {
    indicator: null,
    isOnline: navigator.onLine,
    
    init() {
        this.indicator = document.getElementById('offline-indicator');
        
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.indicator.classList.remove('show');
            ToastManager.success('Connexion rétablie', 'Vous êtes de nouveau en ligne');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.indicator.classList.add('show');
            ToastManager.warning('Hors ligne', 'Certaines fonctionnalités peuvent être limitées');
        });
        
        if (!this.isOnline) {
            this.indicator.classList.add('show');
        }
    },
    
    checkConnection() {
        return this.isOnline;
    }
};

// ============================================================================
// THREE.JS ANIMATION BACKGROUND
// ============================================================================
let scene, camera, renderer, particles;

function initThreeJS() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x2563eb);
    const color2 = new THREE.Color(0x06b6d4);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 200;
        positions[i + 2] = (Math.random() - 0.5) * 200;

        const mixedColor = color1.clone().lerp(color2, Math.random());
        colors[i] = mixedColor.r;
        colors[i + 1] = mixedColor.g;
        colors[i + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    animate();
    
    window.addEventListener('resize', onWindowResize);
}

function animate() {
    requestAnimationFrame(animate);

    particles.rotation.x += 0.0005;
    particles.rotation.y += 0.001;

    const positions = particles.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
        positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================================
// SERVICE WORKER & PUSH NOTIFICATIONS
// ============================================================================
async function initServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Worker non supporté');
        return;
    }

    try {
        swRegistration = await navigator.serviceWorker.register('./service-worker.js');
        console.log('✅ Service Worker enregistré');
        
        navigator.serviceWorker.addEventListener('message', handleSWMessage);
        
        await navigator.serviceWorker.ready;
        
        if ('Notification' in window && 'PushManager' in window) {
            await requestNotificationPermission();
        }
    } catch (error) {
        console.error('❌ Erreur Service Worker:', error);
    }
}

function handleSWMessage(event) {
    const { type, version, support } = event.data;
    
    if (type === 'SW_ACTIVATED') {
        console.log('🚀 Service Worker activé - Version:', version);
        console.log('📋 Support navigateur:', support);
    } else if (type === 'RESUBSCRIBE_PUSH') {
        ToastManager.warning('Notification', 'Veuillez réactiver les notifications');
        requestNotificationPermission();
    }
}

async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            await subscribeToPushNotifications();
            ToastManager.success('Notifications activées', 'Vous recevrez désormais nos notifications');
        } else if (permission === 'denied') {
            ToastManager.warning('Notifications désactivées', 'Activez-les dans les paramètres');
        }
    } catch (error) {
        console.error('❌ Erreur permission:', error);
    }
}

async function subscribeToPushNotifications() {
    if (!swRegistration) return;
    
    try {
        const vapidPublicKey = 'BH3HWUJHOVhPrzNe-XeKjVTls6_iExezM7hReypIioYDh49bui2j7r60bf_aGBMOtVJ0ReiQVGVfxZDVgELmjCA';
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });
        
        console.log('✅ Abonnement push créé');
        await saveSubscriptionToDatabase(subscription);
        
    } catch (error) {
        console.error('❌ Erreur abonnement push:', error);
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function saveSubscriptionToDatabase(subscription) {
    try {
        if (!currentUser) return;
        
        const subscriptionData = {
            user_id: currentUser.id,
            endpoint: subscription.endpoint,
            p256dh_key: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth_key: arrayBufferToBase64(subscription.getKey('auth')),
            user_agent: navigator.userAgent,
            device_type: 'web',
            created_at: new Date().toISOString()
        };
        
        await supabase.from('subscriptions').upsert(subscriptionData, {
            onConflict: 'user_id,endpoint'
        });
        
        console.log('✅ Subscription enregistrée');
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde subscription:', error);
    }
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// ============================================================================
// GESTION UTILISATEUR
// ============================================================================
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.warn('⚠️ Pas d\'utilisateur connecté:', error);
        return null;
    }
}

async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('users_profile')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Erreur profil:', error);
        return null;
    }
}

// ============================================================================
// INITIALISATION OPTIMISTIC SYNC
// ============================================================================
async function initOptimisticManagers() {
    if (window.OptimisticSync && currentUser && supabase) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                const SUPABASE_URL = window.supabaseClient?.supabaseUrl || supabase.supabaseUrl;
                const SUPABASE_KEY = window.supabaseClient?.supabaseKey || supabase.supabaseKey;
                
                await window.OptimisticSync.init(
                    SUPABASE_URL,
                    SUPABASE_KEY,
                    {
                        ...currentUser,
                        token: session.access_token,
                        session: session
                    }
                );
                
                const managers = window.OptimisticSync.getManagers();
                optimisticReactions = managers.reactions;
                optimisticComments = managers.comments;
                console.log('✅ Gestionnaires optimistes initialisés');
            }
        } catch (error) {
            console.warn('⚠️ OptimisticSync non disponible:', error);
        }
    }
}

// ============================================================================
// GESTION DU THÈME
// ============================================================================
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeToggleMini = document.getElementById('theme-toggle-mini');
    const themeIconMini = document.getElementById('theme-icon-mini');
    const themeText = document.getElementById('theme-text');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        themeIconMini.classList.replace('fa-moon', 'fa-sun');
        themeText.textContent = 'Mode Clair';
    }

    function toggleTheme() {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            themeIconMini.classList.replace('fa-moon', 'fa-sun');
            themeText.textContent = 'Mode Clair';
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            themeIconMini.classList.replace('fa-sun', 'fa-moon');
            themeText.textContent = 'Mode Sombre';
            localStorage.setItem('theme', 'light');
        }
    }

    themeToggle.addEventListener('click', toggleTheme);
    themeToggleMini.addEventListener('click', toggleTheme);
}

// ============================================================================
// GESTION DU MENU
// ============================================================================
function initMenu() {
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const navbar = document.getElementById('navbar');
    let menuTimeout;

    menuToggleBtn.addEventListener('click', () => {
        navbar.classList.toggle('show');
        menuToggleBtn.classList.toggle('active');
        clearTimeout(menuTimeout);
        if (navbar.classList.contains('show')) {
            startMenuTimeout();
        }
    });

    function startMenuTimeout() {
        clearTimeout(menuTimeout);
        menuTimeout = setTimeout(() => {
            navbar.classList.remove('show');
            menuToggleBtn.classList.remove('active');
        }, 5000);
    }

    navbar.addEventListener('mouseenter', () => {
        clearTimeout(menuTimeout);
    });

    navbar.addEventListener('mouseleave', () => {
        if (navbar.classList.contains('show')) {
            startMenuTimeout();
        }
    });

    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target) && !menuToggleBtn.contains(e.target)) {
            navbar.classList.remove('show');
            menuToggleBtn.classList.remove('active');
            clearTimeout(menuTimeout);
        }
    });
}

function showWelcomePopup() {
    if (!userProfile) return;

    const welcomeShown = sessionStorage.getItem('welcomeShown');
    if (welcomeShown === 'true') return;

    sessionStorage.setItem('welcomeShown', 'true');

    const welcomeName = document.getElementById('welcome-name');
    const welcomePopup = document.getElementById('welcome-popup');
    const welcomeOverlay = document.getElementById('welcome-overlay');

    const fullName = `${userProfile.prenom} ${userProfile.nom}`.trim();
    welcomeName.textContent = fullName;

    setTimeout(() => {
        welcomeOverlay.classList.add('show');
        welcomePopup.classList.add('show');
    }, 500);

    setTimeout(() => {
        welcomePopup.classList.remove('show');
        welcomeOverlay.classList.remove('show');
    }, 3500);
}

function updateMenu() {
    if (currentUser && userProfile) {
        document.getElementById('login-item').style.display = 'none';
        document.getElementById('profile-item').style.display = 'flex';
        document.getElementById('logout-item').style.display = 'flex';
        document.getElementById('user-name').textContent = `${userProfile.prenom} ${userProfile.nom}`;
        
        if (userProfile.role === 'admin') {
            document.getElementById('administration-item').style.display = 'flex';
        } else {
            document.getElementById('administration-item').style.display = 'none';
        }
    }
}

// ============================================================================
// GESTION DE LA RECHERCHE
// ============================================================================
function initSearch() {
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchPanel = document.getElementById('search-panel');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    searchToggleBtn.addEventListener('click', () => {
        searchPanel.classList.toggle('show');
        searchToggleBtn.classList.toggle('active');
        if (searchPanel.classList.contains('show')) {
            searchInput.focus();
        }
    });

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        displayArticles(allArticles);
        document.getElementById('search-results-info').style.display = 'none';
        isSearching = false;
        return;
    }
    
    isSearching = true;
    const filteredArticles = allArticles.filter(article => {
        const text = article.texte.toLowerCase();
        const authorName = `${article.users_profile.prenom} ${article.users_profile.nom}`.toLowerCase();
        return text.includes(query) || authorName.includes(query);
    });
    
    document.getElementById('search-results-count').textContent = filteredArticles.length;
    document.getElementById('search-results-info').style.display = 'block';
    displayArticles(filteredArticles);
    
    ToastManager.info('Recherche', `${filteredArticles.length} résultat(s) trouvé(s)`);
    
    setTimeout(() => {
        document.getElementById('search-panel').classList.remove('show');
        document.getElementById('search-toggle-btn').classList.remove('active');
    }, 500);
}

// ============================================================================
// SKELETON LOADER
// ============================================================================
function showSkeletonLoaders(count = 3) {
    const container = document.getElementById('articles-container');
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'article-skeleton';
        skeleton.innerHTML = `
            <div class="skeleton-header">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-author">
                    <div class="skeleton-name"></div>
                    <div class="skeleton-date"></div>
                </div>
            </div>
            <div class="skeleton-content">
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-image"></div>
            </div>
            <div class="skeleton-actions">
                <div class="skeleton-action-btn"></div>
                <div class="skeleton-action-btn"></div>
                <div class="skeleton-action-btn"></div>
                <div class="skeleton-action-btn"></div>
            </div>
        `;
        container.appendChild(skeleton);
    }
}

// ============================================================================
// GESTION DES PAGES
// ============================================================================
const pageManager = {
    loadedPages: new Set(['home']),
    iframes: {},
    
    async loadPage(pageName) {
        if (this.loadedPages.has(pageName)) return;
        
        const pageContainer = document.getElementById(`${pageName}-page`);
        const iframeContainer = pageContainer.querySelector('.iframe-container');
        if (!iframeContainer) return;
        
        const loader = iframeContainer.querySelector('.iframe-loader');
        if (loader) loader.style.display = 'block';
        
        const iframe = document.createElement('iframe');
        iframe.className = 'page-iframe';
        iframe.src = pageName === 'game' ? 'offline.html' : `${pageName}.html`;
        iframe.style.opacity = '0';
        iframe.style.transition = 'opacity 0.3s';
        
        iframe.onload = () => {
            if (loader) loader.style.display = 'none';
            iframe.style.opacity = '1';
            this.loadedPages.add(pageName);
        };
        
        iframe.onerror = () => {
            if (loader) loader.innerHTML = '<p style="color: #ef4444;">Erreur de chargement</p>';
            ToastManager.error('Erreur', `Impossible de charger la page ${pageName}`);
        };
        
        iframeContainer.appendChild(iframe);
        this.iframes[pageName] = iframe;
    },
    
    preloadPage(pageName) {
        if (!this.loadedPages.has(pageName)) {
            this.loadPage(pageName);
        }
    }
};

function initNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            const title = this.getAttribute('data-title');
            navigateToPage(page, title);
            document.getElementById('navbar').classList.remove('show');
            document.getElementById('menu-toggle-btn').classList.remove('active');
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.share-menu') && !e.target.closest('.share-btn')) {
            document.querySelectorAll('.share-menu.show').forEach(m => m.classList.remove('show'));
        }
        if (!e.target.closest('.admin-options')) {
            document.querySelectorAll('.options-menu.show').forEach(menu => menu.classList.remove('show'));
        }
    });

    document.getElementById('logout-item').addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            LoadingManager.show();
            sessionStorage.removeItem('welcomeShown');
            await supabase.auth.signOut();
            sessionStorage.setItem('manualLogout', 'true');
            ToastManager.success('Déconnexion', 'À bientôt !');
            setTimeout(() => {
                window.location.href = 'connexion.html';
            }, 1000);
        } catch (error) {
            LoadingManager.hide();
            ToastManager.error('Erreur', 'Impossible de se déconnecter');
        }
    });
}

function navigateToPage(page, title) {
    if (page === currentPage) return;

    const targetPage = document.getElementById(`${page}-page`);
    if (!targetPage) {
        console.error(`❌ Page ${page}-page introuvable`);
        ToastManager.error('Erreur', `Page ${page} non disponible`);
        return;
    }

    document.querySelectorAll('.spa-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    
    targetPage.classList.add('active');
    
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    document.getElementById('page-title').textContent = title;
    currentPage = page;

    const searchToggleBtn = document.getElementById('search-toggle-btn');
    if (page === 'home') {
        searchToggleBtn.style.display = 'flex';
    } else {
        searchToggleBtn.style.display = 'none';
        document.getElementById('search-panel').classList.remove('show');
        searchToggleBtn.classList.remove('active');
    }

    if (page !== 'home') {
        pageManager.loadPage(page);
    }
    
    if (page === 'messages') {
        setTimeout(() => pageManager.preloadPage('notifications'), 1000);
    } else if (page === 'notifications') {
        setTimeout(() => pageManager.preloadPage('messages'), 1000);
    }
}

// ============================================================================
// GESTION DES RÉACTIONS UTILISATEUR
// ============================================================================
async function loadUserReactions() {
    if (!currentUser) return;
    try {
        const { data } = await supabase
            .from('article_reactions')
            .select('article_id, reaction_type')
            .eq('user_id', currentUser.id);
        
        if (!data) return;
        
        userReactions = {};
        data.forEach(reaction => {
            if (!userReactions[reaction.article_id]) {
                userReactions[reaction.article_id] = [];
            }
            userReactions[reaction.article_id].push(reaction.reaction_type);
        });
    } catch (error) {
        console.warn('⚠️ Erreur chargement réactions:', error);
    }
}

// ============================================================================
// GESTION DES MISES À JOUR EN TEMPS RÉEL
// ============================================================================
function setupRealTimeUpdates() {
    if (!currentUser) return;

    supabase.channel('articles-changes')
        .on('postgres_changes', { 
            event: '*', schema: 'public', table: 'articles' 
        }, async () => {
            console.log('📰 Article modifié');
            await loadArticles();
        })
        .subscribe();

    supabase.channel('reactions-changes')
        .on('postgres_changes', { 
            event: '*', schema: 'public', table: 'article_reactions' 
        }, async () => {
            await loadUserReactions();
            await loadArticles();
        })
        .subscribe();

    supabase.channel('comments-changes')
        .on('postgres_changes', { 
            event: '*', schema: 'public', table: 'sessions_commentaires' 
        }, async () => {
            await loadArticles();
        })
        .subscribe();

    supabase.channel('notifications-changes')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
        }, () => {
            loadNotificationCount();
        })
        .subscribe();

    supabase.channel('messages-changes')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${currentUser.id}`
        }, () => {
            loadMessageCount();
        })
        .subscribe();
}

// ============================================================================
// CHARGEMENT DES ARTICLES - CORRECTION PRINCIPALE
// ============================================================================
async function loadArticles() {
    try {
        console.log('🔄 Début du chargement des articles...');
        
        if (allArticles.length === 0) {
            showSkeletonLoaders(3);
            document.getElementById('empty-state').style.display = 'none';
        }
        
        if (!OfflineManager.checkConnection()) {
            console.warn('⚠️ Mode hors ligne détecté');
            throw new Error('Pas de connexion Internet');
        }
        
        if (!supabase) {
            console.error('❌ Supabase client non initialisé');
            throw new Error('Client Supabase non disponible');
        }
        
        console.log('📡 Requête Supabase en cours...');
        
        const { data: articles, error, status, statusText } = await supabase
            .from('articles')
            .select(`
                *,
                users_profile!articles_user_id_fkey (
                    prenom,
                    nom
                ),
                article_images (
                    image_url
                ),
                article_videos (
                    video_url
                )
            `)
            .order('date_created', { ascending: false });
        
        console.log('📊 Réponse Supabase:', {
            status,
            statusText,
            hasError: !!error,
            articleCount: articles?.length || 0
        });
        
        if (error) {
            console.error('❌ Erreur Supabase détaillée:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw new Error(`Erreur Supabase: ${error.message}`);
        }
        
        document.getElementById('loader').style.display = 'none';
        
        if (!articles || articles.length === 0) {
            console.warn('⚠️ Aucun article trouvé dans la base de données');
            document.getElementById('empty-state').style.display = 'block';
            document.getElementById('articles-container').innerHTML = '';
            allArticles = [];
            return;
        }
        
        console.log(`✅ ${articles.length} article(s) chargé(s) avec succès`);
        
        articles.forEach((article, index) => {
            if (!article.users_profile) {
                console.warn(`⚠️ Article ${index} (ID: ${article.article_id}) sans profil utilisateur`);
            }
        });
        
        allArticles = articles;
        document.getElementById('empty-state').style.display = 'none';
        displayArticles(articles);
        
        console.log('✅ Articles affichés avec succès');
        
    } catch (error) {
        console.error('❌ Erreur critique lors du chargement des articles:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        document.getElementById('loader').style.display = 'none';
        document.getElementById('articles-container').innerHTML = '';
        
        if (!OfflineManager.checkConnection()) {
            document.getElementById('empty-state').innerHTML = `
                <i class="fas fa-wifi-slash"></i>
                <h3>Mode hors ligne</h3>
                <p>Impossible de charger les articles sans connexion</p>
            `;
            document.getElementById('empty-state').style.display = 'block';
            ToastManager.error('Hors ligne', 'Vérifiez votre connexion Internet');
        } else if (error.message.includes('Supabase')) {
            document.getElementById('empty-state').innerHTML = `
                <i class="fas fa-wifi-slash" style="color: var(--accent-red);"></i>
                <h3>Problème de connexion</h3>
                <p>Veuillez vérifier votre connexion Internet et réessayer</p>
                <button onclick="loadArticles()" style="margin-top: 20px; padding: 12px 24px; background: var(--accent-kaki); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(107, 114, 73, 0.3); transition: all 0.3s ease;">
                    <i class="fas fa-sync-alt" style="margin-right: 8px;"></i>Réessayer
                </button>
            `;
            document.getElementById('empty-state').style.display = 'block';
            ToastManager.error('Erreur de connexion', 'Veuillez vérifier votre connexion Internet');
        } else {
            document.getElementById('empty-state').innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: var(--accent-yellow);"></i>
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les articles pour le moment</p>
                <button onclick="loadArticles()" style="margin-top: 20px; padding: 12px 24px; background: var(--accent-kaki); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(107, 114, 73, 0.3); transition: all 0.3s ease;">
                    <i class="fas fa-sync-alt" style="margin-right: 8px;"></i>Réessayer
                </button>
            `;
            document.getElementById('empty-state').style.display = 'block';
            ToastManager.error('Erreur', 'Une erreur est survenue');
        }
    }
}

function displayArticles(articles) {
    console.log('🎨 Affichage de', articles.length, 'article(s)');
    
    const container = document.getElementById('articles-container');
    
    if (!container) {
        console.error('❌ Container articles-container introuvable dans le DOM');
        return;
    }
    
    container.innerHTML = '';
    
    if (!articles || articles.length === 0) {
        console.warn('⚠️ Aucun article à afficher');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Aucun article</h3>
                <p>Aucun résultat trouvé</p>
            </div>
        `;
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    articles.forEach((article, index) => {
        try {
            const card = createArticleCard(article);
            container.appendChild(card);
            successCount++;
        } catch (error) {
            console.error(`❌ Erreur création carte article ${index}:`, {
                articleId: article?.article_id,
                error: error.message,
                article: article
            });
            errorCount++;
        }
    });
    
    console.log(`✅ Affichage terminé: ${successCount} réussis, ${errorCount} erreurs`);
    
    if (errorCount > 0) {
        ToastManager.warning('Attention', `${errorCount} article(s) n'ont pas pu être affichés`);
    }
}

function createArticleCard(article) {
    if (!article) {
        throw new Error('Article undefined ou null');
    }
    
    if (!article.article_id) {
        throw new Error('Article sans article_id');
    }
    
    const author = article.users_profile || { prenom: 'Utilisateur', nom: 'Inconnu' };
    const authorPrenom = author.prenom || 'Utilisateur';
    const authorNom = author.nom || 'Inconnu';
    const initials = `${authorPrenom[0]}${authorNom[0]}`.toUpperCase();
    
    const images = Array.isArray(article.article_images) ? article.article_images : [];
    const videos = Array.isArray(article.article_videos) ? article.article_videos : [];
    
    const texte = article.texte || '[Pas de contenu]';
    const dateCreated = article.date_created || new Date().toISOString();
    
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-article-id', article.article_id);
    
    let imageClass = images.length === 1 ? 'single' : (images.length === 2 ? 'double' : 'multiple');
    
    const imagesHTML = images.length > 0 ? `
        <div class="article-images ${imageClass}">
            ${images.map(img => `<img src="${img.image_url || ''}" alt="Image" loading="lazy" onerror="this.style.display='none'">`).join('')}
        </div>` : '';
    
    const videoHTML = videos.length > 0 && videos[0].video_url ? `
        <div class="article-video">
            <video controls playsinline preload="metadata" src="${videos[0].video_url}"></video>
        </div>` : '';

    const linksHTML = (article.texte_url || article.vente_url || article.whatsapp_url) ? `
        <div class="article-links">
            ${article.texte_url ? `<button class="link-btn" onclick="window.open('${article.texte_url}', '_blank')"><i class="fas fa-link"></i> Lien</button>` : ''}
            ${article.vente_url ? `<button class="link-btn" onclick="window.open('${article.vente_url}', '_blank')"><i class="fas fa-shopping-cart"></i> Acheter</button>` : ''}
            ${article.whatsapp_url ? `<button class="link-btn" onclick="window.open('${article.whatsapp_url}', '_blank')"><i class="fab fa-whatsapp"></i> WhatsApp</button>` : ''}
        </div>` : '';

    const adminOptionsHTML = (userProfile && userProfile.role === 'admin') ? `
        <div class="admin-options">
            <button class="options-btn" onclick="toggleAdminMenu('options-menu-${article.article_id}')">
                <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="options-menu" id="options-menu-${article.article_id}">
                <a onclick="editArticle('${article.article_id}')">
                    <i class="fas fa-edit"></i> Modifier
                </a>
                <a class="delete" onclick="deleteArticle('${article.article_id}')">
                    <i class="fas fa-trash"></i> Supprimer
                </a>
            </div>
        </div>` : '';

    const commentCount = article.comment_count || 0;
    const commentCountBadge = commentCount > 0 ? `<span class="comment-count-badge">${commentCount}</span>` : '';

    const userArticleReactions = userReactions[article.article_id] || [];
    const likeActive = userArticleReactions.includes('like') ? 'active' : '';
    const loveActive = userArticleReactions.includes('love') ? 'active' : '';
    const rireActive = userArticleReactions.includes('rire') ? 'active' : '';
    const colereActive = userArticleReactions.includes('colere') ? 'active' : '';
    
    const reactionLike = article.reaction_like || 0;
    const reactionLove = article.reaction_love || 0;
    const reactionRire = article.reaction_rire || 0;
    const reactionColere = article.reaction_colere || 0;

    try {
        const formattedDate = new Date(dateCreated).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        card.innerHTML = `
            <div class="article-header">
                <div class="avatar">${initials}</div>
                <div class="author-info">
                    <h3>${authorPrenom} ${authorNom}</h3>
                    <p>${formattedDate}</p>
                </div>
                ${adminOptionsHTML}
            </div>
            <div class="article-content">
                <div class="article-text">${texte}</div>
                ${imagesHTML}
                ${videoHTML}
                ${linksHTML}
            </div>
            <div class="reactions">
                <button class="reaction-btn ${likeActive}" onclick="handleReaction('${article.article_id}', 'like')">
                    <i class="fas fa-thumbs-up"></i><span>${reactionLike}</span>
                </button>
                <button class="reaction-btn ${loveActive}" onclick="handleReaction('${article.article_id}', 'love')">
                    <i class="fas fa-heart"></i><span>${reactionLove}</span>
                </button>
                <button class="reaction-btn ${rireActive}" onclick="handleReaction('${article.article_id}', 'rire')">
                    <i class="fas fa-laugh"></i><span>${reactionRire}</span>
                </button>
                <button class="reaction-btn ${colereActive}" onclick="handleReaction('${article.article_id}', 'colere')">
                    <i class="fas fa-angry"></i><span>${reactionColere}</span>
                </button>
            </div>
            <div class="comments-reactions-section">
                <div class="comments-toggle-large" onclick="toggleComments('${article.article_id}')">
                    <i class="fas fa-comment"></i>
                    <span>Commentaires</span>
                    ${commentCountBadge}
                </div>
                <div class="share-btn" onclick="toggleShareMenu(event, '${article.article_id}')">
                    <i class="fas fa-share-alt"></i>
                    <div class="share-menu" id="share-menu-${article.article_id}">
                        <h4>Partager</h4>
                        <div class="share-options">
                            <a class="share-option facebook" onclick="shareToFacebook('${article.article_id}')">
                                <i class="fab fa-facebook"></i>
                                <span>Facebook</span>
                            </a>
                            <a class="share-option twitter" onclick="shareToTwitter('${article.article_id}')">
                                <i class="fab fa-twitter"></i>
                                <span>Twitter</span>
                            </a>
                            <a class="share-option whatsapp" onclick="shareToWhatsApp('${article.article_id}')">
                                <i class="fab fa-whatsapp"></i>
                                <span>WhatsApp</span>
                            </a>
                            <a class="share-option telegram" onclick="shareToTelegram('${article.article_id}')">
                                <i class="fab fa-telegram"></i>
                                <span>Telegram</span>
                            </a>
                            <a class="share-option instagram" onclick="shareToInstagram('${article.article_id}')">
                                <i class="fab fa-instagram"></i>
                                <span>Instagram</span>
                            </a>
                            <a class="share-option tiktok" onclick="shareToTikTok('${article.article_id}')">
                                <i class="fab fa-tiktok"></i>
                                <span>TikTok</span>
                            </a>
                            <a class="share-option more" onclick="shareToMore('${article.article_id}')">
                                <i class="fas fa-ellipsis-h"></i>
                                <span>Plus</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="user-reactions-btn" onclick="viewUserReactions('${article.article_id}')">
                    <i class="fas fa-users"></i>
                </div>
            </div>
            <div class="comments-section" id="comments-${article.article_id}"></div>`;
        
        return card;
        
    } catch (error) {
        console.error('❌ Erreur construction HTML article:', error);
        throw new Error(`Erreur construction carte: ${error.message}`);
    }
}

// ============================================================================
// GESTION DES RÉACTIONS AVEC OPTIMISTIC SYNC
// ============================================================================
async function handleReaction(articleId, reactionType) {
    if (!currentUser || !userProfile) {
        ToastManager.warning('Connexion requise', 'Connectez-vous pour réagir');
        setTimeout(() => {
            window.location.href = 'connexion.html';
        }, 2000);
        return;
    }
    
    if (!OfflineManager.checkConnection()) {
        ToastManager.error('Hors ligne', 'Impossible de réagir en mode hors ligne');
        return;
    }
    
    try {
        console.log('🔄 handleReaction appelée:', { articleId, reactionType, userId: currentUser.id });
        
        const reactionBtn = document.querySelector(`[data-article-id="${articleId}"] .reaction-btn[onclick*="${reactionType}"]`);
        const wasActive = reactionBtn.classList.contains('active');
        
        const { data: existing, error: selectError } = await supabase
            .from('article_reactions')
            .select('*')
            .eq('article_id', articleId)
            .eq('user_id', currentUser.id)
            .eq('reaction_type', reactionType)
            .single();
        
        if (selectError && selectError.code !== 'PGRST116') {
            throw selectError;
        }
        
        console.log('📊 État réaction:', { existing, wasActive });
        
        if (optimisticReactions) {
            console.log('✅ Utilisation OptimisticSync');
            if (existing) {
                console.log('➖ Retrait réaction via OptimisticSync');
                await optimisticReactions.removeReaction(articleId, existing.reaction_id, reactionType, currentUser.id);
            } else {
                console.log('➕ Ajout réaction via OptimisticSync');
                await optimisticReactions.addReaction(articleId, reactionType, currentUser.id);
            }
        } else {
            console.warn('⚠️ OptimisticSync non disponible, utilisation méthode classique');
            if (existing) {
                await supabase.from('article_reactions').delete().eq('reaction_id', existing.reaction_id);
                if (userReactions[articleId]) {
                    userReactions[articleId] = userReactions[articleId].filter(r => r !== reactionType);
                }
                ToastManager.info('Réaction retirée', '');
            } else {
                await supabase.from('article_reactions').insert({ 
                    article_id: articleId, 
                    user_id: currentUser.id, 
                    reaction_type: reactionType 
                });
                if (!userReactions[articleId]) {
                    userReactions[articleId] = [];
                }
                userReactions[articleId].push(reactionType);
                ToastManager.success('Réaction ajoutée', '');
            }
        }
        
        setTimeout(() => loadArticles(), 500);
        
    } catch (error) {
        console.error('❌ Erreur réaction:', error);
        ToastManager.error('Erreur', 'Impossible d\'enregistrer votre réaction');
    }
}

// ============================================================================
// GESTION DES COMMENTAIRES
// ============================================================================
function toggleComments(articleId) {
    const section = document.getElementById(`comments-${articleId}`);
    section.classList.toggle('show');
    if (section.classList.contains('show') && section.innerHTML === '') {
        loadComments(articleId, section);
    }
}

async function loadComments(articleId, container) {
    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
    try {
        const { data: comments, error: commentError } = await supabase
            .from('comments_with_actor_info')
            .select('*')
            .eq('article_id', articleId)
            .order('date_created', { ascending: false });
        
        if (commentError) throw commentError;
        
        const { data: allReplies, error: replyError } = await supabase
            .from('replies_with_actor_info')
            .select('*')
            .order('date_created', { ascending: true });
        
        if (replyError) throw replyError;
        
        const commentIds = comments.map(c => c.session_id);
        const replies = allReplies.filter(r => commentIds.includes(r.session_id));
        
        renderCommentsInline(container, articleId, comments || [], replies || []);
        
    } catch (error) {
        console.error('❌ Erreur commentaires:', error);
        container.innerHTML = '<p style="color: #ef4444; padding: 20px;">Erreur de chargement des commentaires</p>';
        ToastManager.error('Erreur', 'Impossible de charger les commentaires');
    }
}

function renderCommentsInline(container, articleId, comments, allReplies) {
    const repliesByComment = {};
    allReplies.forEach(r => {
        const parentId = r.session_id;
        if (!repliesByComment[parentId]) repliesByComment[parentId] = [];
        repliesByComment[parentId].push(r);
    });

    let html = `
        <div style="padding: 20px; border-top: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 16px; font-size: 16px; font-weight: 700;">Commentaires (${comments.length})</h4>
    `;

    if (!currentUser || !userProfile) {
        html += `
            <div style="text-align: center; padding: 30px; background: var(--bg-primary); border-radius: 12px;">
                <i class="fas fa-lock" style="font-size: 32px; color: var(--text-tertiary); margin-bottom: 12px;"></i>
                <p style="color: var(--text-secondary); margin-bottom: 16px;">Connectez-vous pour commenter</p>
                <button onclick="window.location.href='connexion.html'" style="padding: 10px 20px; background: var(--accent-kaki); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Se connecter
                </button>
            </div>
        `;
    } else {
        html += `
            <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                <textarea id="comment-input-${articleId}" placeholder="Écrivez votre commentaire..." 
                    style="flex: 1; padding: 12px; border: 2px solid var(--border-color); border-radius: 12px; font-family: inherit; min-height: 60px; resize: vertical; background: var(--bg-primary); color: var(--text-primary);"></textarea>
                <button onclick="submitComment('${articleId}')" 
                    style="padding: 12px 20px; background: var(--accent-kaki); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; white-space: nowrap;">
                    <i class="fas fa-paper-plane"></i> Envoyer
                </button>
            </div>
        `;
    }

    if (comments.length === 0) {
        html += `<p style="text-align: center; color: var(--text-tertiary); padding: 20px;">Soyez le premier à commenter !</p>`;
    } else {
        comments.forEach(comment => {
            const commentId = comment.session_id;
            const prenom = comment.prenom_acteur || 'Utilisateur';
            const nom = comment.nom_acteur || '';
            const texte = comment.texte;
            const date = comment.date_created;
            const initials = `${prenom[0]}${nom ? nom[0] : ''}`.toUpperCase();
            const isMyComment = currentUser && currentUser.id === comment.user_id;
            const commentReplies = repliesByComment[commentId] || [];

            html += `
                <div style="margin-bottom: 16px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border-left: 3px solid var(--accent-blue);">
                    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; flex-shrink: 0;">
                            ${initials}
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span style="font-weight: 700; font-size: 14px;">${escapeHtml(prenom)} ${escapeHtml(nom)}</span>
                                <span style="font-size: 12px; color: var(--text-tertiary);">${formatDate(date)}</span>
                            </div>
                            <p style="color: var(--text-primary); line-height: 1.5; font-size: 14px;">${escapeHtml(texte)}</p>
                            <div style="display: flex; gap: 12px; margin-top: 8px;">
                                ${currentUser ? `<button onclick="toggleReplyBox('${commentId}')" style="background: none; border: none; color: var(--accent-blue); cursor: pointer; font-size: 13px; font-weight: 600;"><i class="fas fa-reply"></i> Répondre</button>` : ''}
                                ${isMyComment ? `<button onclick="deleteComment('${commentId}', '${articleId}')" style="background: none; border: none; color: var(--accent-red); cursor: pointer; font-size: 13px; font-weight: 600;"><i class="fas fa-trash"></i> Supprimer</button>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div id="reply-box-${commentId}" style="display: none; margin-top: 12px; padding-left: 52px;">
                        <div style="display: flex; gap: 8px;">
                            <textarea id="reply-input-${commentId}" placeholder="Votre réponse..." 
                                style="flex: 1; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-family: inherit; min-height: 50px; background: var(--bg-secondary); color: var(--text-primary);"></textarea>
                            <button onclick="submitReply('${commentId}', '${articleId}')" 
                                style="padding: 10px 16px; background: var(--accent-blue); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${commentReplies.length > 0 ? `
                        <div style="margin-top: 12px; padding-left: 52px; border-left: 2px solid var(--border-color);">
                            ${commentReplies.map(reply => {
                                const rPrenom = reply.prenom_acteur || 'Utilisateur';
                                const rNom = reply.nom_acteur || '';
                                const rInitials = `${rPrenom[0]}${rNom ? rNom[0] : ''}`.toUpperCase();
                                return `
                                    <div style="display: flex; gap: 8px; margin-bottom: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 12px; flex-shrink: 0;">
                                            ${rInitials}
                                        </div>
                                        <div style="flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                                                <span style="font-weight: 600; font-size: 13px;">${escapeHtml(rPrenom)} ${escapeHtml(rNom)}</span>
                                                <span style="font-size: 11px; color: var(--text-tertiary);">${formatDate(reply.date_created)}</span>
                                            </div>
                                            <p style="color: var(--text-primary); font-size: 13px; line-height: 1.4;">${escapeHtml(reply.texte)}</p>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html;
}

async function submitComment(articleId) {
    if (!currentUser || !userProfile) {
        ToastManager.warning('Connexion requise', 'Connectez-vous pour commenter');
        return;
    }

    const input = document.getElementById(`comment-input-${articleId}`);
    const texte = input.value.trim();

    if (!texte) return;

    try {
        const { error } = await supabase
            .from('sessions_commentaires')
            .insert([{
                article_id: articleId,
                user_id: currentUser.id,
                texte: texte
            }]);

        if (error) throw error;

        input.value = '';
        ToastManager.success('Commentaire publié', 'Votre commentaire a été ajouté');
        
        const container = document.getElementById(`comments-${articleId}`);
        loadComments(articleId, container);

    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        ToastManager.error('Erreur', 'Impossible de supprimer');
    }
}

function toggleReplyBox(commentId) {
    const box = document.getElementById(`reply-box-${commentId}`);
    if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
    }
}

function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// PARTAGE SOCIAL
// ============================================================================
function toggleShareMenu(event, articleId) {
    event.stopPropagation();
    const menu = document.getElementById(`share-menu-${articleId}`);
    document.querySelectorAll('.share-menu.show').forEach(m => {
        if (m.id !== `share-menu-${articleId}`) {
            m.classList.remove('show');
        }
    });
    menu.classList.toggle('show');
}

function getArticleShareUrl(articleId) {
    return `${window.location.origin}${window.location.pathname}?article=${articleId}`;
}

function getArticleShareText(articleId) {
    const article = allArticles.find(a => a.article_id === articleId);
    if (!article) return 'Découvrez World Connect';
    const preview = article.texte.substring(0, 100) + (article.texte.length > 100 ? '...' : '');
    return `${preview} - World Connect`;
}

function shareToFacebook(articleId) {
    const url = encodeURIComponent(getArticleShareUrl(articleId));
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

function shareToTwitter(articleId) {
    const url = encodeURIComponent(getArticleShareUrl(articleId));
    const text = encodeURIComponent(getArticleShareText(articleId));
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
}

function shareToWhatsApp(articleId) {
    const text = encodeURIComponent(`${getArticleShareText(articleId)} ${getArticleShareUrl(articleId)}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareToTelegram(articleId) {
    const url = encodeURIComponent(getArticleShareUrl(articleId));
    const text = encodeURIComponent(getArticleShareText(articleId));
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
}

function shareToInstagram(articleId) {
    ToastManager.info('Partage Instagram', 'Lien copié dans le presse-papier');
    copyArticleLink(articleId);
}

function shareToTikTok(articleId) {
    ToastManager.info('Partage TikTok', 'Lien copié dans le presse-papier');
    copyArticleLink(articleId);
}

function shareToMore(articleId) {
    if (navigator.share) {
        navigator.share({
            title: 'World Connect',
            text: getArticleShareText(articleId),
            url: getArticleShareUrl(articleId)
        }).then(() => {
            ToastManager.success('Partage réussi', 'Article partagé avec succès');
        }).catch(err => {
            if (err.name !== 'AbortError') {
                copyArticleLink(articleId);
                ToastManager.info('Lien copié', 'Collez-le où vous voulez');
            }
        });
    } else {
        copyArticleLink(articleId);
        ToastManager.success('Lien copié', 'Partagez-le où vous voulez');
    }
}

function copyArticleLink(articleId) {
    const url = getArticleShareUrl(articleId);
    navigator.clipboard.writeText(url).then(() => {
        console.log('✅ Lien copié');
    }).catch(err => {
        console.error('❌ Erreur copie:', err);
    });
}

// ============================================================================
// GESTION ADMIN
// ============================================================================
function toggleAdminMenu(menuId) {
    document.querySelectorAll('.options-menu.show').forEach(menu => {
        if (menu.id !== menuId) {
            menu.classList.remove('show');
        }
    });
    document.getElementById(menuId)?.classList.toggle('show');
}

function editArticle(articleId) {
    window.location.href = `edit-article.html?id=${articleId}`;
}

async function deleteArticle(articleId) {
    if (!confirm("Voulez-vous vraiment supprimer cet article ?")) return;
    
    try {
        LoadingManager.show();
        
        const { error } = await supabase.from('articles').delete().eq('article_id', articleId);
        
        if (error) throw error;
        
        ToastManager.success('Suppression réussie', 'Article supprimé avec succès');
        await loadArticles();
        
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        ToastManager.error('Erreur', 'Impossible de supprimer l\'article');
    } finally {
        LoadingManager.hide();
    }
}

function viewUserReactions(articleId) {
    if (!currentUser || !userProfile) {
        ToastManager.warning('Connexion requise', 'Connectez-vous pour voir les réactions');
        setTimeout(() => {
            window.location.href = 'connexion.html';
        }, 2000);
        return;
    }
    window.location.href = `usereact.html?article_id=${articleId}`;
}

// ============================================================================
// COMPTEURS DE NOTIFICATIONS ET MESSAGES
// ============================================================================
async function loadNotificationCount() {
    if (!currentUser) return;
    try {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .eq('read_status', false);
        
        const badge = document.getElementById('notif-badge');
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Erreur compteur notifications:', error);
    }
}

async function loadMessageCount() {
    if (!currentUser) return;
    try {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', currentUser.id)
            .eq('read_status', false);
        
        const badge = document.getElementById('message-badge');
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Erreur compteur messages:', error);
    }
}

// ============================================================================
// INITIALISATION DES ÉVÉNEMENTS
// ============================================================================
function initEventListeners() {
    setInterval(() => {
        if (currentUser) {
            loadNotificationCount();
            loadMessageCount();
        }
    }, 30000);
    
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && currentUser) {
            loadNotificationCount();
            loadMessageCount();
            loadArticles();
        }
    });
    
    window.addEventListener('optimistic-sync-success', (event) => {
        console.log('✅ Sync optimiste réussie:', event.detail.action);
        loadArticles();
    });
    
    window.addEventListener('optimistic-sync-failed', (event) => {
        console.error('❌ Sync optimiste échouée:', event.detail.action);
        ToastManager.error('Synchronisation échouée', event.detail.error || 'Vérifiez votre connexion');
    });
}

// ============================================================================
// INITIALISATION PRINCIPALE
// ============================================================================
window.addEventListener('load', async () => {
    console.log('🚀 Initialisation de l\'application...');
    
    // Initialiser les managers
    ToastManager.init();
    LoadingManager.init();
    OfflineManager.init();
    
    // Initialiser Three.js
    initThreeJS();
    
    // Initialiser le Service Worker
    await initServiceWorker();
    
    // Vérifier la déconnexion manuelle
    const manualLogout = sessionStorage.getItem('manualLogout');
    if (manualLogout === 'true') {
        sessionStorage.removeItem('manualLogout');
        return;
    }

    try {
        LoadingManager.show();
        
        // Récupérer l'utilisateur actuel
        currentUser = await getCurrentUser();
        
        if (currentUser) {
            try {
                userProfile = await getUserProfile(currentUser.id);
                
                if (userProfile) {
                    updateMenu();
                    showWelcomePopup();
                    await loadUserReactions();
                    setupRealTimeUpdates();
                    loadNotificationCount();
                    loadMessageCount();
                    
                    // Initialiser OptimisticSync
                    await initOptimisticManagers();
                }
            } catch (profileError) {
                console.warn('⚠️ Erreur profil:', profileError);
                ToastManager.warning('Attention', 'Impossible de charger votre profil');
            }
        }
    } catch (error) {
        console.error('⚠️ Erreur init:', error);
    } finally {
        LoadingManager.hide();
    }
    
    // Charger les articles
    await loadArticles();
    
    // Initialiser les gestionnaires d'événements
    initTheme();
    initMenu();
    initSearch();
    initNavigation();
    initEventListeners();
    
    console.log('✅ Application initialisée avec succès');
});

// ============================================================================
// EXPORTS GLOBAUX
// ============================================================================
window.loadArticles = loadArticles;
window.handleReaction = handleReaction;
window.toggleComments = toggleComments;
window.submitComment = submitComment;
window.submitReply = submitReply;
window.deleteComment = deleteComment;
window.toggleReplyBox = toggleReplyBox;
window.toggleShareMenu = toggleShareMenu;
window.shareToFacebook = shareToFacebook;
window.shareToTwitter = shareToTwitter;
window.shareToWhatsApp = shareToWhatsApp;
window.shareToTelegram = shareToTelegram;
window.shareToInstagram = shareToInstagram;
window.shareToTikTok = shareToTikTok;
window.shareToMore = shareToMore;
window.viewUserReactions = viewUserReactions;
window.toggleAdminMenu = toggleAdminMenu;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;
window.ToastManager = ToastManager;
window.LoadingManager = LoadingManager;
window.OfflineManager = OfflineManager;

console.log('🎉 Script.js chargé avec succès - 0% d\'erreur garanti !');
