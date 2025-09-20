// js/services/authService.js
import { db } from '../supabaseClient.js';

const ADMIN_UID = '445d3380-fe34-4856-bd85-22a6d57e2e5e';

export async function getCurrentUser() {
    const { data: { session }, error: sessionError } = await db.auth.getSession();

    if (sessionError) {
        console.error('Erreur de session:', sessionError);
        return null;
    }

    if (!session) {
        return null; // Pas d'utilisateur connecté
    }

    // L'utilisateur est connecté, maintenant vérifions son rôle
    const user = session.user;
    
    // Logique spéciale pour l'administrateur
    if (user.id === ADMIN_UID) {
        return { ...user, role: 'admin' };
    }

    // Pour les autres utilisateurs, on récupère leur profil pour connaître leur rôle
    const { data: profile, error: profileError } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Erreur pour récupérer le profil:', profileError);
        // On retourne l'utilisateur de base sans rôle pour éviter de bloquer l'app
        return { ...user, role: 'user' }; 
    }
    
    // On fusionne les infos de l'utilisateur avec son rôle
    return { ...user, role: profile ? profile.role : 'user' };
}

export async function signInWithMagicLink(email) {
    const { error } = await db.auth.signInWithOtp({
        email: email,
    });
    if (error) {
        alert("Erreur lors de l'envoi du lien : " + error.message);
    } else {
        alert('Lien de connexion envoyé ! Vérifiez votre boîte mail.');
    }
}

export async function signInWithPassword(email, password) {
    const { error } = await db.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) {
        alert("Erreur de connexion : " + error.message);
    }
}

export async function signOut() {
    await db.auth.signOut();
    // Rafraîchit la page pour réinitialiser l'état de l'application
    window.location.reload(); 
}
