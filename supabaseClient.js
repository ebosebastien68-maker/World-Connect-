// supabaseClient.js - Fichier central pour la connexion à Supabase

const SUPABASE_URL = 'https://odkbkloukpzvwxaomkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka2JrbG91a3B6dnd4YW9ta2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTQ1MzIsImV4cCI6MjA4MDkzMDUzMn0.sFT09tJkGHdXgWt9oxoE_Rz_USBlRHxx-vb4HLveOyM';

// On s'assure de n'initialiser le client qu'une seule fois.
if (!window.supabaseClient) {
    // ✅ CRÉER L'INSTANCE EN DEHORS DU SCOPE LOCAL
    const supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    /**
     * Récupère l'objet utilisateur actuellement connecté en se basant sur la session.
     * @returns {Promise<object|null>} L'objet utilisateur ou null si non connecté.
     */
    async function getCurrentUser() {
        try {
            const { data: { session }, error } = await supabaseClientInstance.auth.getSession();
            if (error) throw error;
            return session ? session.user : null;
        } catch (error) {
            console.error("Erreur lors de la récupération de la session:", error.message);
            return null;
        }
    }

    /**
     * Récupère le profil complet de l'utilisateur depuis la table 'users_profile'.
     * @param {string} userId - L'ID de l'utilisateur.
     * @returns {Promise<object|null>} L'objet profil ou null en cas d'erreur.
     */
    async function getUserProfile(userId) {
        if (!userId) {
            console.error("getUserProfile a été appelé sans userId.");
            return null;
        }

        try {
            const { data, error, status } = await supabaseClientInstance
                .from('users_profile')
                .select('user_id, prenom, nom, role') // ✅ Ajout de user_id
                .eq('user_id', userId)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            return data;

        } catch (error) {
            console.error("Erreur lors de la récupération du profil:", error.message);
            return null;
        }
    }

    /**
     * Déconnecte l'utilisateur actuel.
     */
    async function signOut() {
        const { error } = await supabaseClientInstance.auth.signOut();
        if (error) {
            console.error('Erreur lors de la déconnexion:', error.message);
        }
        window.location.href = '/'; 
    }

    /**
     * Redirige l'utilisateur vers la page appropriée en fonction de son rôle.
     */
    async function redirectByRole() {
        const user = await getCurrentUser();
        
        if (!user) {
            console.log("Redirection annulée : utilisateur non connecté.");
            return;
        }

        const profile = await getUserProfile(user.id);
        
        if (!profile) {
            console.warn('Profil utilisateur introuvable. Redirection vers index.html par défaut.');
            window.location.href = 'index.html';
            return;
        }

        if (profile.role === 'admin') {
            window.location.href = 'publier.html';
        } else {
            window.location.href = 'index.html';
        }
    }

    /**
     * Vérifie si l'utilisateur est connecté et le redirige si nécessaire.
     * @param {boolean} requireAuth - Si true, redirige vers connexion.html si non connecté
     * @param {string|null} requiredRole - Si spécifié, vérifie que l'utilisateur a ce rôle
     */
    async function checkAuthAndRedirect(requireAuth = false, requiredRole = null) {
        const user = await getCurrentUser();
        
        if (requireAuth && !user) {
            console.log("Authentification requise. Redirection vers connexion.html");
            window.location.href = 'connexion.html';
            return false;
        }

        if (user && requiredRole) {
            const profile = await getUserProfile(user.id);
            
            if (!profile) {
                console.warn("Profil introuvable. Redirection vers connexion.html");
                await signOut();
                return false;
            }

            if (profile.role !== requiredRole) {
                console.warn(`Rôle insuffisant. Requis: ${requiredRole}, Actuel: ${profile.role}`);
                if (profile.role === 'admin') {
                    window.location.href = 'publier.html';
                } else {
                    window.location.href = 'index.html';
                }
                return false;
            }
        }

        return true;
    }

    /**
     * Vérifie simplement si l'utilisateur est connecté sans redirection.
     * @returns {Promise<boolean>}
     */
    async function isLoggedIn() {
        const user = await getCurrentUser();
        return user !== null;
    }

    // ✅ Expose les fonctions et le client sur l'objet window
    window.supabaseClient = {
        supabase: supabaseClientInstance,  // ✅ Utilise la bonne référence
        getCurrentUser,
        getUserProfile,
        signOut,
        redirectByRole,
        checkAuthAndRedirect,
        isLoggedIn
    };

    console.log('✅ Supabase Client initialisé avec succès');
}
