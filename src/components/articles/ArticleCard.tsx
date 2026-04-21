"use client";

// ═══════════════════════════════════════════════════════════════
//  src/components/articles/ArticleCard.tsx
//  Extrait depuis : index.html → createArticleCard()
//
//  Tout ce qui était dans la fonction createArticleCard() est ici :
//    - Header auteur + date
//    - Texte avec bouton "Voir plus" (toggleFullText)
//    - Images (single/double/multiple)
//    - Vidéo
//    - Liens (texte_url, vente_url, whatsapp_url)
//    - Options admin (modifier/supprimer)
//    - ReactionButtons ← composant séparé
//    - Bouton commentaires → CommentsWidget
//    - Partage social (Facebook, Twitter, WhatsApp, Telegram, Plus)
//    - Bouton voir les réactions → /reactions/[articleId]
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Share2, Users, ChevronDown, ChevronUp,
  ExternalLink, ShoppingCart, Link2, MoreVertical, Pencil, Trash2,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ReactionButtons } from "@/components/articles/ReactionButtons";
import { CommentsWidget }   from "@/components/comments/CommentsWidget";
import { getInitials, formatDate, truncate } from "@/lib/utils";
import type { Article, UserProfile, ReactionType } from "@/types/supabase";

// ─── Props ────────────────────────────────────────────────────
interface ArticleCardProps {
  article:       Article;
  currentUser:   { id: string } | null;
  userProfile:   UserProfile | null;
  userReactions: ReactionType[];     // réactions de l'user sur CET article
  onDeleted:     () => void;         // callback quand article supprimé
  onReacted:     () => void;         // callback quand réaction posée
}

// ─── Icône réseaux sociaux inline (pas de dep externe) ────────
const FB  = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877f2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.885v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>;
const TW  = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="#1da1f2"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>;
const WA  = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
const TG  = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="#0088cc"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;

// ─── Composant ────────────────────────────────────────────────
export function ArticleCard({
  article,
  currentUser,
  userProfile,
  userReactions,
  onDeleted,
  onReacted,
}: ArticleCardProps) {
  const router   = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [expanded,       setExpanded]       = useState(false);
  const [showComments,   setShowComments]   = useState(false);
  const [showShare,      setShowShare]      = useState(false);
  const [showAdminMenu,  setShowAdminMenu]  = useState(false);
  const [deleting,       setDeleting]       = useState(false);

  const author    = article.users_profile ?? { prenom: "Utilisateur", nom: "Inconnu" };
  const initials  = getInitials(article.users_profile?.prenom ?? "U", article.users_profile?.nom ?? "");
  const isAdmin   = userProfile?.role === "admin";
  const TEXT_LIMIT = 300;
  const isLong    = (article.texte?.length ?? 0) > TEXT_LIMIT;
  const images    = article.article_images ?? [];
  const videos    = article.article_videos ?? [];

  // ── viewUserReactions → /reactions/[articleId] ──────────────
  function handleViewReactions() {
    if (!currentUser) { router.push("/auth"); return; }
    router.push(`/reactions/${article.article_id}`);
  }

  // ── deleteArticle depuis index.html ─────────────────────────
  async function handleDelete() {
    if (!confirm("Voulez-vous vraiment supprimer cet article ?")) return;
    setDeleting(true);
    await supabase.from("articles").delete().eq("article_id", article.article_id);
    onDeleted();
    setDeleting(false);
  }

  // ── Partage social (remplace shareToX depuis index.html) ────
  const shareUrl  = typeof window !== "undefined"
    ? `${window.location.origin}/?article=${article.article_id}`
    : "";
  const shareText = truncate(article.texte ?? "", 100) + " - World Connect";

  function share(platform: string) {
    const u = encodeURIComponent(shareUrl);
    const t = encodeURIComponent(shareText);
    const urls: Record<string, string> = {
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      twitter:   `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      whatsapp:  `https://wa.me/?text=${t}%20${u}`,
      telegram:  `https://t.me/share/url?url=${u}&text=${t}`,
    };
    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    } else if (platform === "more") {
      if (navigator.share) {
        void navigator.share({ title: "World Connect", text: shareText, url: shareUrl });
      } else {
        void navigator.clipboard.writeText(shareUrl);
      }
    }
    setShowShare(false);
  }

  // ── Image grid class (single / double / multiple) ───────────
  const imgClass = images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <article
      className="rounded-2xl overflow-hidden anim-fade-in transition-all"
      style={{
        background:   "var(--gradient-card)",
        border:       "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        boxShadow:    "var(--shadow-sm)",
      }}
      data-article-id={article.article_id}
    >
      {/* ── Barre de couleur en haut ───────────────────────── */}
      <div className="h-0.5 w-full" style={{ background: "var(--gradient-border)" }} />

      {/* ── Header auteur ─────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid var(--border-light)" }}
      >
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-lg"
          style={{ background: "var(--gradient-btn)", boxShadow: "var(--shadow-cyber)" }}
        >
          {initials}
        </div>

        {/* Nom + date */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>
            {author.prenom} {author.nom}
          </p>
          <p className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
            {formatDate(article.date_created)}
          </p>
        </div>

        {/* Options admin (remplace adminOptionsHTML) */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className="p-2 rounded-full transition-all"
              style={{ background: "var(--globe-ghost)", color: "var(--foreground-muted)" }}
            >
              <MoreVertical size={16} />
            </button>
            {showAdminMenu && (
              <div
                className="absolute right-0 top-10 rounded-xl overflow-hidden z-10 min-w-[140px] anim-fade-in-scale"
                style={{ background: "var(--navy-700)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
              >
                <button
                  onClick={() => { setShowAdminMenu(false); router.push(`/plus?edit=${article.article_id}`); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold hover:bg-white/5 transition-colors"
                  style={{ color: "var(--cyber-400)" }}
                >
                  <Pencil size={14} /> Modifier
                </button>
                <button
                  onClick={() => { setShowAdminMenu(false); void handleDelete(); }}
                  disabled={deleting}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold hover:bg-white/5 transition-colors"
                  style={{ color: "var(--danger)" }}
                >
                  <Trash2 size={14} /> {deleting ? "Suppression…" : "Supprimer"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Contenu de l'article ──────────────────────────── */}
      <div className="px-5 py-4 flex flex-col gap-4">

        {/* Texte + bouton "Voir plus" (remplace toggleFullText) */}
        {article.texte && (
          <div>
            <p
              className="text-sm leading-relaxed"
              style={{
                color:      "var(--foreground-muted)",
                whiteSpace: "pre-wrap",
                wordBreak:  "break-word",
              }}
            >
              {isLong && !expanded
                ? truncate(article.texte, TEXT_LIMIT)
                : article.texte}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-2 text-xs font-bold transition-colors"
                style={{ color: "var(--cyber-500)" }}
              >
                {expanded ? <><ChevronUp size={13} /> Voir moins</> : <><ChevronDown size={13} /> Voir plus</>}
              </button>
            )}
          </div>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div className={`grid ${imgClass} gap-2`}>
            {images.map((img, i) => (
              <img
                key={i}
                src={img.image_url}
                alt=""
                loading="lazy"
                className="w-full rounded-xl object-cover"
                style={{ aspectRatio: images.length === 1 ? "16/9" : "1", maxHeight: "360px" }}
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            ))}
          </div>
        )}

        {/* Vidéo */}
        {videos.length > 0 && videos[0]?.video_url && (
          <video
            controls
            playsInline
            preload="metadata"
            src={videos[0].video_url}
            className="w-full rounded-xl"
            style={{ maxHeight: "360px" }}
          />
        )}

        {/* Liens (texte_url, vente_url, whatsapp_url) */}
        {(article.texte_url || article.vente_url || article.whatsapp_url) && (
          <div className="flex gap-2 flex-wrap">
            {article.texte_url && (
              <a href={article.texte_url} target="_blank" rel="noreferrer"
                className="wc-btn flex-1" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", justifyContent: "center" }}>
                <Link2 size={13} /> Lien
              </a>
            )}
            {article.vente_url && (
              <a href={article.vente_url} target="_blank" rel="noreferrer"
                className="wc-btn flex-1" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", justifyContent: "center" }}>
                <ShoppingCart size={13} /> Acheter
              </a>
            )}
            {article.whatsapp_url && (
              <a href={article.whatsapp_url} target="_blank" rel="noreferrer"
                className="wc-btn flex-1" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", justifyContent: "center", background: "linear-gradient(135deg,#25d366,#128c7e)" }}>
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── Boutons de réactions ──────────────────────────── */}
      <ReactionButtons
        articleId={article.article_id}
        counts={{
          like:   article.reaction_like   ?? 0,
          love:   article.reaction_love   ?? 0,
          rire:   article.reaction_rire   ?? 0,
          colere: article.reaction_colere ?? 0,
        }}
        userReactions={userReactions}
        currentUserId={currentUser?.id ?? null}
        onReacted={onReacted}
      />

      {/* ── Barre actions (commentaires / partage / réactions) */}
      <div
        className="flex"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        {/* Commentaires */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors hover:bg-white/5"
          style={{
            color:       showComments ? "var(--cyber-500)" : "var(--foreground-muted)",
            borderRight: "1px solid var(--border-light)",
          }}
        >
          <MessageCircle size={17} />
          <span>Commentaires</span>
          {(article.comment_count ?? 0) > 0 && (
            <span className="wc-badge" style={{ fontSize: "0.6rem" }}>{article.comment_count}</span>
          )}
        </button>

        {/* Partage */}
        <div className="relative">
          <button
            onClick={() => { setShowShare(!showShare); setShowAdminMenu(false); }}
            className="flex items-center justify-center gap-1.5 px-5 py-3.5 text-sm font-bold transition-colors hover:bg-white/5"
            style={{
              color:       "var(--foreground-muted)",
              borderRight: "1px solid var(--border-light)",
            }}
          >
            <Share2 size={17} />
          </button>
          {showShare && (
            <div
              className="absolute bottom-full right-0 mb-2 rounded-2xl p-4 z-20 anim-fade-in-scale"
              style={{
                background:  "var(--navy-700)",
                border:      "1px solid var(--border)",
                boxShadow:   "var(--shadow-lg)",
                minWidth:    "240px",
              }}
            >
              <p className="text-xs font-bold mb-3 text-center" style={{ color: "var(--foreground-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Partager
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "facebook", Icon: FB,    label: "Facebook" },
                  { id: "twitter",  Icon: TW,    label: "Twitter"  },
                  { id: "whatsapp", Icon: WA,    label: "WhatsApp" },
                  { id: "telegram", Icon: TG,    label: "Telegram" },
                ].map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => share(id)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all hover:scale-105"
                    style={{ background: "var(--globe-ghost)" }}
                  >
                    <Icon />
                    <span className="text-xs" style={{ color: "var(--foreground-subtle)", fontSize: "0.6rem" }}>{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => share("more")}
                className="flex items-center justify-center gap-2 w-full mt-2 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-white/10"
                style={{ background: "var(--globe-ghost)", color: "var(--cyber-400)" }}
              >
                <ExternalLink size={13} /> Plus d'options
              </button>
            </div>
          )}
        </div>

        {/* Voir qui a réagi */}
        <button
          onClick={handleViewReactions}
          className="flex items-center justify-center px-5 py-3.5 transition-colors hover:bg-white/5"
          style={{ color: "var(--foreground-muted)" }}
          title="Voir les réactions"
        >
          <Users size={17} />
        </button>
      </div>

      {/* ── Section commentaires (CommentsWidget) ─────────── */}
      {showComments && (
        <CommentsWidget
          articleId={article.article_id}
          currentUser={currentUser}
          userProfile={userProfile}
        />
      )}
    </article>
  );
      }
          
