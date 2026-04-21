"use client";

// ═══════════════════════════════════════════════════════════════
//  CommentsWidget.tsx — v4.0 TypeScript
//  Converti depuis commentaires.js v3.0
//  Utilise globals.css (--navy-*, --cyber-*, --silver-*)
//  + classes Tailwind du tailwind.config.ts
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Reply, Pencil, Trash2, X, Check, MessageCircle, Lock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { insertComment, updateComment, deleteComment, insertReply, deleteReply } from "@/lib/supabase/mutations";
import { cn, getInitials, formatDate } from "@/lib/utils";
import type { UserProfile } from "@/types/supabase";

// ─── Types locaux ─────────────────────────────────────────────
interface Comment {
  session_id:    string;
  article_id:    string;
  acteur_id:     string;
  prenom_acteur: string;
  nom_acteur:    string;
  texte:         string;
  date_created:  string;
}

interface Reply {
  reponse_id:    string;
  session_id:    string;
  acteur_id:     string;
  prenom_acteur: string;
  nom_acteur:    string;
  texte:         string;
  date_created:  string;
}

interface CommentsWidgetProps {
  articleId:   string;
  currentUser: { id: string } | null;
  userProfile: UserProfile | null;
}

// ─── Formatage date relative ──────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000)      return "À l'instant";
  if (diff < 3600000)    return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000)   return `Il y a ${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000)  return `Il y a ${Math.floor(diff / 86400000)}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── Avatar initiales ─────────────────────────────────────────
function Avatar({ prenom, nom, size = "md" }: { prenom: string; nom: string; size?: "sm" | "md" }) {
  const initials = getInitials(prenom, nom);
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold flex-shrink-0",
        "text-white",
        size === "md" ? "w-11 h-11 text-base" : "w-9 h-9 text-sm"
      )}
      style={{ background: "var(--gradient-btn)", boxShadow: "var(--shadow-cyber)" }}
    >
      {initials}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────
export function CommentsWidget({ articleId, currentUser, userProfile }: CommentsWidgetProps) {
  const supabase = createSupabaseBrowserClient();

  const [comments, setComments]         = useState<Comment[]>([]);
  const [replies, setReplies]           = useState<Reply[]>([]);
  const [loading, setLoading]           = useState(true);
  const [newComment, setNewComment]     = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [openReplyId, setOpenReplyId]   = useState<string | null>(null);
  const [replyTexts, setReplyTexts]     = useState<Record<string, string>>({});
  const [editModal, setEditModal]       = useState<{ type: "comment" | "reply"; id: string; text: string } | null>(null);
  const [editText, setEditText]         = useState("");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Chargement ───────────────────────────────────────────────
  const load = useCallback(async () => {
    const [{ data: cData }, { data: rData }] = await Promise.all([
      supabase.from("comments_with_actor_info").select("*").eq("article_id", articleId).order("date_created", { ascending: false }),
      supabase.from("replies_with_actor_info").select("*").order("date_created", { ascending: true }),
    ]);
    const commentIds = (cData ?? []).map((c: Comment) => c.session_id);
    setComments((cData as Comment[]) ?? []);
    setReplies(((rData as Reply[]) ?? []).filter((r) => commentIds.includes(r.session_id)));
    setLoading(false);
  }, [articleId, supabase]);

  // ── Temps réel ───────────────────────────────────────────────
  useEffect(() => {
    void load();
    channelRef.current = supabase
      .channel(`comments:${articleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions_commentaires", filter: `article_id=eq.${articleId}` }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "session_reponses" }, () => void load())
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [articleId, load, supabase]);

  // ── Soumettre commentaire ────────────────────────────────────
  async function handleSubmitComment() {
    if (!currentUser || !newComment.trim()) return;
    setSubmitting(true);
    await insertComment(supabase, articleId, currentUser.id, newComment.trim());
    setNewComment("");
    setSubmitting(false);
  }

  // ── Soumettre réponse ────────────────────────────────────────
  async function handleSubmitReply(parentId: string) {
    if (!currentUser || !replyTexts[parentId]?.trim()) return;
    await insertReply(supabase, parentId, currentUser.id, replyTexts[parentId].trim());
    setReplyTexts((p) => ({ ...p, [parentId]: "" }));
    setOpenReplyId(null);
  }

  // ── Supprimer commentaire ────────────────────────────────────
  async function handleDeleteComment(commentId: string) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    await deleteComment(supabase, commentId);
  }

  // ── Supprimer réponse ────────────────────────────────────────
  async function handleDeleteReply(replyId: string) {
    if (!confirm("Supprimer cette réponse ?")) return;
    await deleteReply(supabase, replyId);
  }

  // ── Modal édition ────────────────────────────────────────────
  function openEdit(type: "comment" | "reply", id: string, text: string) {
    setEditModal({ type, id, text });
    setEditText(text);
  }

  async function handleSaveEdit() {
    if (!editModal || !currentUser || !editText.trim()) return;
    if (editModal.type === "comment") {
      await updateComment(supabase, editModal.id, currentUser.id, editText.trim());
    }
    setEditModal(null);
  }

  const isAdmin    = userProfile?.role === "admin";
  const isLoggedIn = !!currentUser && !!userProfile;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ background: "var(--background-card)", borderTop: "1px solid var(--border)" }}>

      {/* En-tête */}
      <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <MessageCircle size={18} style={{ color: "var(--cyber-500)" }} />
        <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
          Commentaires ({comments.length})
        </span>
      </div>

      {/* Zone de saisie */}
      <div className="px-5 py-4">
        {!isLoggedIn ? (
          <div
            className="flex flex-col items-center gap-3 py-6 rounded-xl"
            style={{ background: "var(--globe-ghost)", border: "1px solid var(--border)" }}
          >
            <Lock size={28} style={{ color: "var(--foreground-subtle)" }} />
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Connectez-vous pour commenter</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <Avatar prenom={userProfile.prenom} nom={userProfile.nom} />
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrivez votre commentaire..."
                rows={3}
                className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background:   "var(--navy-800)",
                  border:       "1px solid var(--border)",
                  color:        "var(--foreground)",
                  fontFamily:   "var(--font-sans)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyber-500)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="wc-btn self-end"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem", opacity: !newComment.trim() ? 0.5 : 1 }}
              >
                <Send size={14} />
                {submitting ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste commentaires */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--cyber-500)", borderTopColor: "transparent" }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center py-8 text-sm" style={{ color: "var(--foreground-subtle)" }}>
          Soyez le premier à commenter !
        </p>
      ) : (
        <div className="flex flex-col gap-4 px-5 pb-5">
          {comments.map((comment) => {
            const commentReplies = replies.filter((r) => r.session_id === comment.session_id);
            const canDelete = isAdmin || currentUser?.id === comment.acteur_id;
            const canEdit   = currentUser?.id === comment.acteur_id;

            return (
              <div
                key={comment.session_id}
                className="rounded-xl p-4 transition-all"
                style={{
                  background:  "var(--navy-800)",
                  borderLeft:  "3px solid var(--cyber-500)",
                  border:      "1px solid var(--border)",
                  borderLeftColor: "var(--cyber-500)",
                }}
              >
                {/* Header commentaire */}
                <div className="flex gap-3 mb-3">
                  <Avatar prenom={comment.prenom_acteur} nom={comment.nom_acteur} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                      <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                        {comment.prenom_acteur} {comment.nom_acteur}
                      </span>
                      <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                        {timeAgo(comment.date_created)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)", whiteSpace: "pre-wrap" }}>
                      {comment.texte}
                    </p>
                  </div>
                </div>

                {/* Actions commentaire */}
                <div className="flex gap-4 ml-14">
                  {isLoggedIn && (
                    <button
                      onClick={() => setOpenReplyId(openReplyId === comment.session_id ? null : comment.session_id)}
                      className="flex items-center gap-1 text-xs font-semibold transition-colors"
                      style={{ color: "var(--cyber-500)" }}
                    >
                      <Reply size={13} /> Répondre
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => openEdit("comment", comment.session_id, comment.texte)}
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: "var(--silver-400)" }}
                    >
                      <Pencil size={13} /> Modifier
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(comment.session_id)}
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: "var(--danger)" }}
                    >
                      <Trash2 size={13} /> Supprimer
                    </button>
                  )}
                </div>

                {/* Zone réponse */}
                {openReplyId === comment.session_id && isLoggedIn && (
                  <div className="flex gap-2 mt-3 ml-14">
                    <Avatar prenom={userProfile!.prenom} nom={userProfile!.nom} size="sm" />
                    <div className="flex-1 flex gap-2">
                      <textarea
                        value={replyTexts[comment.session_id] ?? ""}
                        onChange={(e) => setReplyTexts((p) => ({ ...p, [comment.session_id]: e.target.value }))}
                        placeholder="Votre réponse…"
                        rows={2}
                        className="flex-1 resize-none rounded-lg px-3 py-2 text-xs outline-none"
                        style={{
                          background: "var(--navy-900)",
                          border:     "1px solid var(--border)",
                          color:      "var(--foreground)",
                          fontFamily: "var(--font-sans)",
                        }}
                      />
                      <button
                        onClick={() => handleSubmitReply(comment.session_id)}
                        className="wc-btn"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Réponses */}
                {commentReplies.length > 0 && (
                  <div className="mt-4 ml-14 pl-4 flex flex-col gap-3"
                    style={{ borderLeft: "2px solid var(--border)" }}>
                    {commentReplies.map((reply) => (
                      <div key={reply.reponse_id} className="flex gap-2">
                        <Avatar prenom={reply.prenom_acteur} nom={reply.nom_acteur} size="sm" />
                        <div className="flex-1 rounded-lg p-3"
                          style={{ background: "var(--navy-900)", border: "1px solid var(--border-light)" }}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs" style={{ color: "var(--foreground)" }}>
                              {reply.prenom_acteur} {reply.nom_acteur}
                            </span>
                            <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                              {timeAgo(reply.date_created)}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)", whiteSpace: "pre-wrap" }}>
                            {reply.texte}
                          </p>
                          {(isAdmin || currentUser?.id === reply.acteur_id) && (
                            <button
                              onClick={() => handleDeleteReply(reply.reponse_id)}
                              className="flex items-center gap-1 text-xs mt-2"
                              style={{ color: "var(--danger)" }}
                            >
                              <Trash2 size={11} /> Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal édition */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(7,15,43,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setEditModal(null)}>
          <div className="w-full max-w-lg rounded-2xl p-6 anim-fade-in-scale"
            style={{ background: "var(--navy-700)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Pencil size={18} style={{ color: "var(--cyber-500)" }} />
                Modifier le commentaire
              </h3>
              <button onClick={() => setEditModal(null)} style={{ color: "var(--foreground-subtle)" }}>
                <X size={20} />
              </button>
            </div>
            <div className="wc-chrome-line mb-4" />
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none mb-4"
              style={{
                background: "var(--navy-900)",
                border:     "1px solid var(--border)",
                color:      "var(--foreground)",
                fontFamily: "var(--font-sans)",
              }}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "var(--globe-ghost)", color: "var(--foreground-muted)" }}>
                Annuler
              </button>
              <button onClick={handleSaveEdit} className="wc-btn" style={{ padding: "0.5rem 1.25rem" }}>
                <Check size={14} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                      }
      
