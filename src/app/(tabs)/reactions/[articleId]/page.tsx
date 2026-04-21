"use client";

// ═══════════════════════════════════════════════════════════════
//  src/app/(tabs)/reactions/[articleId]/page.tsx
//  Converti depuis : usereact.html + usereact.js
//
//  Références HTML → Next.js :
//    supabaseClient.js    → createSupabaseBrowserClient()
//    url ?article_id=xxx  → params.articleId (Next.js dynamic route)
//    window.history.back()→ router.back()
//    Font Awesome         → lucide-react
//    style.css (kaki)     → globals.css (navy/silver/cyber)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Heart, ThumbsUp, Laugh, Angry, ArrowLeft, Users, Globe } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { ReactionType } from "@/types/supabase";

interface ReactionRow {
  reaction_id:   string;
  user_id:       string;
  reaction_type: ReactionType;
  users_profile: { prenom: string; nom: string; } | null;
}

interface ArticleInfo {
  texte: string;
  users_profile: { prenom: string; nom: string; } | null;
  date_created: string;
}

const REACTION_CONFIG: Record<ReactionType, { label: string; icon: React.ReactNode; color: string }> = {
  like:   { label: "J'aime",    icon: <ThumbsUp size={22} />, color: "#4a9eff" },
  love:   { label: "Adore",    icon: <Heart    size={22} />, color: "#ef4444" },
  rire:   { label: "Rire",     icon: <Laugh   size={22} />, color: "#f59e0b" },
  colere: { label: "Colère",   icon: <Angry   size={22} />, color: "#f97316" },
};

export default function ReactionsPage() {
  const router   = useRouter();
  const params   = useParams();
  // articleId vient de [articleId] dans le dossier (remplace ?article_id= dans l'URL)
  const articleId = params.articleId as string;
  const supabase  = createSupabaseBrowserClient();

  const [article,   setArticle]   = useState<ArticleInfo | null>(null);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [filter,    setFilter]    = useState<ReactionType | "all">("all");
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    // Charger l'article (remplace la logique de loadArticleInfo dans usereact.js)
    const { data: art } = await supabase
      .from("articles")
      .select("texte, date_created, users_profile!articles_user_id_fkey(prenom, nom)")
      .eq("article_id", articleId)
      .single();
    if (art) setArticle(art as ArticleInfo);

    // Charger les réactions (remplace loadReactions() dans usereact.js)
    const { data } = await supabase
      .from("article_reactions")
      .select("reaction_id, user_id, reaction_type, users_profile!article_reactions_user_id_fkey(prenom, nom)")
      .eq("article_id", articleId)
      .order("reaction_id", { ascending: false })
      .range(0, page * PAGE_SIZE - 1);
    setReactions((data as ReactionRow[]) ?? []);
    setLoading(false);
  }, [articleId, page, supabase]);

  useEffect(() => { void load(); }, [load]);

  const filtered = filter === "all" ? reactions : reactions.filter((r) => r.reaction_type === filter);
  const counts   = Object.fromEntries(
    (Object.keys(REACTION_CONFIG) as ReactionType[]).map((k) => [k, reactions.filter((r) => r.reaction_type === k).length])
  );

  return (
    <div className="wc-page">
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, height: "60px", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(13,31,78,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ color: "var(--cyber-500)", background: "var(--globe-ghost)" }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-1.5">
            <Heart size={18} style={{ color: "var(--cyber-500)" }} />
            <h1 className="font-black text-base" style={{ color: "white" }}>Réactions sur l'article</h1>
          </div>
        </div>
        <Globe size={20} style={{ color: "var(--cyber-500)" }} />
      </header>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* Article résumé */}
        {article && (
          <div className="wc-card p-4 mb-4 anim-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                style={{ background: "var(--gradient-btn)" }}>
                {getInitials(article.users_profile?.prenom ?? "U", article.users_profile?.nom ?? "")}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "white" }}>
                  {article.users_profile?.prenom} {article.users_profile?.nom}
                </p>
                <p className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                  {new Date(article.date_created).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <p className="text-sm line-clamp-3 pl-14" style={{ color: "var(--foreground-muted)", whiteSpace: "pre-wrap" }}>
              {article.texte?.substring(0, 200)}{(article.texte?.length ?? 0) > 200 ? "…" : ""}
            </p>
          </div>
        )}

        {/* Stats réactions */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][]).map(([key, cfg]) => (
            <div key={key} className="wc-card p-3 flex flex-col items-center gap-1 anim-fade-in">
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              <span className="font-black text-xl" style={{ color: "white" }}>{counts[key] ?? 0}</span>
              <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Onglets filtre */}
        <div className="flex gap-2 p-1.5 rounded-xl mb-4" style={{ background: "var(--globe-ghost)", border: "1px solid var(--border)", overflowX: "auto" }}>
          <button onClick={() => setFilter("all")}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
            style={{ background: filter === "all" ? "var(--gradient-btn)" : "transparent", color: filter === "all" ? "white" : "var(--foreground-muted)" }}>
            <Users size={13} /> Tous ({reactions.length})
          </button>
          {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilter(key)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
              style={{ background: filter === key ? "var(--gradient-btn)" : "transparent", color: filter === key ? "white" : "var(--foreground-muted)" }}>
              <span style={{ color: cfg.color }}>{cfg.icon}</span> {cfg.label} ({counts[key] ?? 0})
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-9 h-9 rounded-full border-2 animate-spin" style={{ borderColor: "var(--cyber-500)", borderTopColor: "transparent" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Heart size={52} style={{ color: "var(--foreground-subtle)", opacity: 0.4 }} />
            <p className="font-bold" style={{ color: "var(--foreground-muted)" }}>Aucune réaction</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((r) => {
              const cfg = REACTION_CONFIG[r.reaction_type];
              const name = `${r.users_profile?.prenom ?? "?"} ${r.users_profile?.nom ?? ""}`;
              return (
                <div key={r.reaction_id} className="wc-card flex items-center gap-3 p-4 anim-fade-in">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                    style={{ background: "var(--gradient-btn)" }}>
                    {getInitials(r.users_profile?.prenom ?? "U", r.users_profile?.nom ?? "")}
                  </div>
                  <p className="flex-1 font-semibold text-sm" style={{ color: "white" }}>{name}</p>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: `${cfg.color}22`, color: cfg.color }}>
                    {cfg.icon} {cfg.label}
                  </div>
                </div>
              );
            })}

            {filtered.length >= page * PAGE_SIZE && (
              <div className="text-center py-4">
                <button onClick={() => setPage((p) => p + 1)} className="wc-btn">
                  Charger plus
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
              }
          
