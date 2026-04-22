// ═══════════════════════════════════════════════════════════════
//  src/lib/optimistic-sync.ts
//  Converti depuis : optimistic-sync.js
//
//  Fournit des helpers pour les mises à jour optimistes avec
//  @tanstack/react-query — met à jour l'UI immédiatement avant
//  que la requête Supabase soit confirmée, et rollback si erreur.
//
//  Usage dans un composant :
//    const { mutate } = useOptimisticReaction(queryClient, articleId)
// ═══════════════════════════════════════════════════════════════

import {
  useQueryClient,
  useMutation,
  type QueryClient,
} from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Article, ReactionType } from "@/types/supabase";

// ─── Clés de requête centralisées ─────────────────────────────
export const QUERY_KEYS = {
  articles:      ["articles"]            as const,
  article:       (id: string) =>         ["articles", id] as const,
  userReactions: (userId: string) =>     ["reactions", userId] as const,
  notifications: (userId: string) =>     ["notifications", userId] as const,
  messages:      (userId: string) =>     ["messages", userId] as const,
  profile:       (userId: string) =>     ["profile", userId] as const,
} as const;

// ─────────────────────────────────────────────────────────────
//  Hook : mise à jour optimiste d'une RÉACTION
//  Equivalent JS : optimisticToggleReaction() dans optimistic-sync.js
// ─────────────────────────────────────────────────────────────
export function useOptimisticReaction(
  articleId:    string,
  currentUserId: string
) {
  const queryClient = useQueryClient();
  const supabase    = createSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (reactionType: ReactionType) => {
      // Vérifie si la réaction existe déjà
      const { data: existing } = await supabase
        .from("article_reactions")
        .select("reaction_id")
        .eq("article_id", articleId)
        .eq("user_id", currentUserId)
        .eq("reaction_type", reactionType)
        .single();

      if (existing) {
        await supabase
          .from("article_reactions")
          .delete()
          .eq("reaction_id", existing.reaction_id);
        return { action: "removed" as const, reactionType };
      } else {
        await supabase
          .from("article_reactions")
          .insert({ article_id: articleId, user_id: currentUserId, reaction_type: reactionType });
        return { action: "added" as const, reactionType };
      }
    },

    // ── Mise à jour optimiste AVANT la requête ─────────────
    onMutate: async (reactionType) => {
      // Annule les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.articles });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userReactions(currentUserId) });

      // Snapshot pour rollback
      const previousArticles  = queryClient.getQueryData<Article[]>(QUERY_KEYS.articles);
      const previousReactions = queryClient.getQueryData<Record<string, ReactionType[]>>(
        QUERY_KEYS.userReactions(currentUserId)
      );

      // Mise à jour optimiste du cache articles (compteur)
      queryClient.setQueryData<Article[]>(QUERY_KEYS.articles, (old) => {
        if (!old) return old;
        return old.map((a) => {
          if (a.article_id !== articleId) return a;
          const field = `reaction_${reactionType}` as keyof Article;
          const current = (a[field] as number) ?? 0;
          const userHas = (previousReactions?.[articleId] ?? []).includes(reactionType);
          return { ...a, [field]: userHas ? Math.max(0, current - 1) : current + 1 };
        });
      });

      // Mise à jour optimiste du cache réactions user
      queryClient.setQueryData<Record<string, ReactionType[]>>(
        QUERY_KEYS.userReactions(currentUserId),
        (old) => {
          const current = old ?? {};
          const existing = current[articleId] ?? [];
          const has = existing.includes(reactionType);
          return {
            ...current,
            [articleId]: has
              ? existing.filter((r) => r !== reactionType)
              : [...existing, reactionType],
          };
        }
      );

      return { previousArticles, previousReactions };
    },

    // ── Rollback si erreur ─────────────────────────────────
    onError: (_err, _vars, context) => {
      if (context?.previousArticles) {
        queryClient.setQueryData(QUERY_KEYS.articles, context.previousArticles);
      }
      if (context?.previousReactions) {
        queryClient.setQueryData(
          QUERY_KEYS.userReactions(currentUserId),
          context.previousReactions
        );
      }
    },

    // ── Revalide toujours après mutation ───────────────────
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.articles });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userReactions(currentUserId) });
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  Hook : mise à jour optimiste d'un COMMENTAIRE (count)
// ─────────────────────────────────────────────────────────────
export function useOptimisticCommentCount(articleId: string) {
  const queryClient = useQueryClient();

  function incrementCount() {
    queryClient.setQueryData<Article[]>(QUERY_KEYS.articles, (old) => {
      if (!old) return old;
      return old.map((a) =>
        a.article_id === articleId
          ? { ...a, comment_count: (a.comment_count ?? 0) + 1 }
          : a
      );
    });
  }

  function decrementCount() {
    queryClient.setQueryData<Article[]>(QUERY_KEYS.articles, (old) => {
      if (!old) return old;
      return old.map((a) =>
        a.article_id === articleId
          ? { ...a, comment_count: Math.max(0, (a.comment_count ?? 0) - 1) }
          : a
      );
    });
  }

  return { incrementCount, decrementCount };
}

// ─────────────────────────────────────────────────────────────
//  Utilitaire : invalider manuellement le cache articles
//  Usage : après une suppression, modification admin, etc.
// ─────────────────────────────────────────────────────────────
export function invalidateArticles(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.articles });
}

// ─────────────────────────────────────────────────────────────
//  Utilitaire : prefetch d'une page (notifications, messages)
//  Evite le flash de chargement quand l'user change d'onglet
// ─────────────────────────────────────────────────────────────
export async function prefetchCounts(
  queryClient: QueryClient,
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string
) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.notifications(userId),
      queryFn: async () => {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("read_status", false);
        return count ?? 0;
      },
      staleTime: 30_000,
    }),
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.messages(userId),
      queryFn: async () => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", userId)
          .eq("read_status", false);
        return count ?? 0;
      },
      staleTime: 30_000,
    }),
  ]);
}
