// ═══════════════════════════════════════════════════════════════════
//  supabase/queries.ts — Toutes les fonctions de l'ancien
//  supabaseClient.js, converties en TypeScript pur
//
//  Ces fonctions remplacent exactement :
//    getCurrentUser(), getUserProfile(), signOut(),
//    redirectByRole(), checkAuthAndRedirect(), isLoggedIn()
// ═══════════════════════════════════════════════════════════════════

import { createSupabaseServerClient } from "./server";
import type { UserProfile, Article, ReactionType } from "@/types/supabase";

// ─────────────────────────────────────────────────────────────────
//  AUTH — remplace getCurrentUser() et getUserProfile()
// ─────────────────────────────────────────────────────────────────

/**
 * Récupère l'utilisateur connecté depuis la session (Server Side).
 * Équivalent de getCurrentUser() dans supabaseClient.js
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Erreur session:", error.message);
    return null;
  }

  return session?.user ?? null;
}

/**
 * Récupère le profil complet depuis la table users_profile.
 * Équivalent de getUserProfile() dans supabaseClient.js
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error, status } = await supabase
    .from("users_profile")
    .select("user_id, prenom, nom, role")
    .eq("user_id", userId)
    .single();

  if (error && status !== 406) {
    console.error("Erreur profil:", error.message);
    return null;
  }

  return data as UserProfile;
}

/**
 * Vérifie si l'utilisateur est connecté.
 * Équivalent de isLoggedIn() dans supabaseClient.js
 */
export async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// ─────────────────────────────────────────────────────────────────
//  ARTICLES — remplace loadArticles() dans index.html
// ─────────────────────────────────────────────────────────────────

/**
 * Récupère tous les articles avec leurs relations.
 * Utilisé dans la page d'accueil (Server Component).
 */
export async function getArticles(): Promise<Article[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      users_profile!articles_user_id_fkey (
        user_id,
        prenom,
        nom
      ),
      article_images ( image_url ),
      article_videos ( video_url )
    `)
    .order("date_created", { ascending: false });

  if (error) {
    console.error("Erreur articles:", error.message);
    return [];
  }

  return (data as Article[]) ?? [];
}

// ─────────────────────────────────────────────────────────────────
//  RÉACTIONS — remplace loadUserReactions()
// ─────────────────────────────────────────────────────────────────

/**
 * Récupère les réactions d'un utilisateur sur tous les articles.
 * Retourne un Map : articleId → ReactionType[]
 */
export async function getUserReactions(
  userId: string
): Promise<Record<string, ReactionType[]>> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("article_reactions")
    .select("article_id, reaction_type")
    .eq("user_id", userId);

  if (error || !data) return {};

  const map: Record<string, ReactionType[]> = {};
  for (const row of data) {
    // ✅ FIX : on initialise puis on récupère dans une variable locale.
    //    Sans ça, TypeScript strict considère map[row.article_id] comme
    //    potentiellement `undefined` même juste après l'initialisation,
    //    car l'index signature retourne toujours `T | undefined`.
    if (!map[row.article_id]) map[row.article_id] = [];
    const bucket = map[row.article_id]!;          // assertion non-nulle ✅
    bucket.push(row.reaction_type as ReactionType);
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────
//  COMPTEURS — remplace loadNotificationCount() / loadMessageCount()
// ─────────────────────────────────────────────────────────────────

/**
 * Nombre de notifications non lues pour un utilisateur.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read_status", false);
  return count ?? 0;
}

/**
 * Nombre de messages non lus pour un utilisateur.
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("read_status", false);
  return count ?? 0;
}

