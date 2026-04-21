// ═══════════════════════════════════════════════════════════════
//  mutations.ts — toutes les opérations d'écriture Supabase
//  Appelées depuis les Client Components ("use client")
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactionType } from "@/types/supabase";

// ─── Réactions articles ───────────────────────────────────────
export async function toggleArticleReaction(
  supabase: SupabaseClient,
  articleId: string,
  userId: string,
  reactionType: ReactionType
) {
  const { data: existing } = await supabase
    .from("article_reactions")
    .select("reaction_id")
    .eq("article_id", articleId)
    .eq("user_id", userId)
    .eq("reaction_type", reactionType)
    .single();

  if (existing) {
    return supabase
      .from("article_reactions")
      .delete()
      .eq("reaction_id", existing.reaction_id);
  }
  return supabase
    .from("article_reactions")
    .insert({ article_id: articleId, user_id: userId, reaction_type: reactionType });
}

// ─── Commentaires ─────────────────────────────────────────────
export async function insertComment(
  supabase: SupabaseClient,
  articleId: string,
  userId: string,
  texte: string
) {
  return supabase
    .from("sessions_commentaires")
    .insert({ article_id: articleId, user_id: userId, texte });
}

export async function updateComment(
  supabase: SupabaseClient,
  commentId: string,
  userId: string,
  texte: string
) {
  return supabase
    .from("sessions_commentaires")
    .update({ texte })
    .eq("session_id", commentId)
    .eq("user_id", userId);
}

export async function deleteComment(
  supabase: SupabaseClient,
  commentId: string
) {
  return supabase
    .from("sessions_commentaires")
    .delete()
    .eq("session_id", commentId);
}

// ─── Réponses ─────────────────────────────────────────────────
export async function insertReply(
  supabase: SupabaseClient,
  parentId: string,
  userId: string,
  texte: string
) {
  return supabase
    .from("session_reponses")
    .insert({ session_id: parentId, user_id: userId, texte });
}

export async function deleteReply(
  supabase: SupabaseClient,
  replyId: string
) {
  return supabase
    .from("session_reponses")
    .delete()
    .eq("reponse_id", replyId);
}

// ─── Notifications ────────────────────────────────────────────
export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string
) {
  return supabase
    .from("notifications")
    .update({ read_status: true })
    .eq("notification_id", notificationId);
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  userId: string
) {
  return supabase
    .from("notifications")
    .update({ read_status: true })
    .eq("user_id", userId)
    .eq("read_status", false);
}

export async function deleteNotification(
  supabase: SupabaseClient,
  notificationId: string
) {
  return supabase
    .from("notifications")
    .delete()
    .eq("notification_id", notificationId);
}

// ─── Messages ─────────────────────────────────────────────────
export async function sendTextMessage(
  supabase: SupabaseClient,
  senderId: string,
  receiverId: string,
  texte: string
) {
  return supabase
    .from("messages")
    .insert({ sender_id: senderId, receiver_id: receiverId, texte, delivery_status: "sent" })
    .select()
    .single();
}

export async function markMessagesRead(
  supabase: SupabaseClient,
  senderId: string,
  receiverId: string
) {
  return supabase
    .from("messages")
    .update({ read_status: true, delivery_status: "read", read_at: new Date().toISOString() })
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .eq("read_status", false);
}
