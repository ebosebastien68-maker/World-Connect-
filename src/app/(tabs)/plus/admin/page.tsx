"use client";

// ═══════════════════════════════════════════════════════════════
//  src/app/(tabs)/plus/admin/page.tsx
//  Dashboard administrateur World Connect
//
//  Accès réservé : role === "admin"
//  Fonctions :
//    - Stats globales (articles, users, réactions, messages)
//    - Liste des derniers articles avec actions rapides
//    - Gestion des utilisateurs (voir profils)
//    - Accès rapide vers /plus/publier
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Globe, ArrowLeft, Newspaper, Users, Heart,
  MessageCircle, Trash2, Pencil, RefreshCw,
  BarChart3, Bell,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, getInitials } from "@/lib/utils";

interface Stats {
  articles:      number;
  users:         number;
  reactions:     number;
  messages:      number;
  notifications: number;
}

interface ArticleRow {
  article_id:   string;
  texte:        string;
  date_created: string;
  reaction_like:   number;
  reaction_love:   number;
  comment_count:   number;
  // ✅ CORRECTION 1 : Supabase retourne un tableau via la jointure, pas un objet simple
  users_profile: { prenom: string; nom: string }[] | null;
}

interface UserRow {
  user_id: string;
  prenom:  string;
  nom:     string;
  role:    string;
}

export default function AdminPage() {
  const router   = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState<Stats>({ articles: 0, users: 0, reactions: 0, messages: 0, notifications: 0 });
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [users,    setUsers]    = useState<UserRow[]>([]);
  const [tab,      setTab]      = useState<"articles" | "users">("articles");
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Vérification admin ────────────────────────────────────
  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth"); return; }
      const { data } = await supabase
        .from("users_profile").select("role").eq("user_id", session.user.id).single();
      if (data?.role !== "admin") { router.replace("/"); return; }
      setLoading(false);
    })();
  }, [supabase, router]);

  // ── Chargement stats et données ──────────────────────────
  const loadData = useCallback(async () => {
    const [
      { count: articlesCount },
      { count: usersCount },
      { count: reactionsCount },
      { count: messagesCount },
      { count: notifsCount },
      { data: artData },
      { data: usrData },
    ] = await Promise.all([
      supabase.from("articles").select("*", { count: "exact", head: true }),
      supabase.from("users_profile").select("*", { count: "exact", head: true }),
      supabase.from("article_reactions").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("read_status", false),
      supabase.from("articles").select("article_id, texte, date_created, reaction_like, reaction_love, comment_count, users_profile!articles_user_id_fkey(prenom,nom)").order("date_created", { ascending: false }).limit(20),
      supabase.from("users_profile").select("user_id, prenom, nom, role").order("prenom").limit(50),
    ]);

    setStats({
      articles:      articlesCount ?? 0,
      users:         usersCount    ?? 0,
      reactions:     reactionsCount ?? 0,
      messages:      messagesCount ?? 0,
      notifications: notifsCount  ?? 0,
    });
    // ✅ CORRECTION 2 : cast via unknown pour éviter l'erreur TypeScript
    setArticles((artData as unknown as ArticleRow[]) ?? []);
    setUsers((usrData as unknown as UserRow[]) ?? []);
  }, [supabase]);

  useEffect(() => { if (!loading) void loadData(); }, [loading, loadData]);

  // ── Supprimer article ─────────────────────────────────────
  async function handleDelete(articleId: string) {
    if (!confirm("Supprimer cet article définitivement ?")) return;
    setDeleting(articleId);
    const { error } = await supabase.from("articles").delete().eq("article_id", articleId);
    if (error) toast.error("Erreur lors de la suppression");
    else { toast.success("Article supprimé"); void loadData(); }
    setDeleting(null);
  }

  if (loading) return (
    <div className="wc-page flex items-center justify-center min-h-dvh">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--cyber-500)", borderTopColor: "transparent" }} />
    </div>
  );

  const STAT_CARDS = [
    { icon: <Newspaper size={20} />,    label: "Articles",       value: stats.articles,      color: "var(--cyber-500)" },
    { icon: <Users     size={20} />,    label: "Utilisateurs",   value: stats.users,         color: "var(--success)" },
    { icon: <Heart     size={20} />,    label: "Réactions",      value: stats.reactions,     color: "#ef4444" },
    { icon: <MessageCircle size={20} />,label: "Messages",       value: stats.messages,      color: "var(--warning)" },
    { icon: <Bell      size={20} />,    label: "Notifs non lues",value: stats.notifications, color: "var(--danger)" },
    { icon: <BarChart3 size={20} />,    label: "Total activité", value: stats.reactions + stats.messages, color: "var(--silver-400)" },
  ];

  return (
    <div className="wc-page">
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, height: "60px", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(13,31,78,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ color: "var(--cyber-500)", background: "var(--globe-ghost)" }}>
            <ArrowLeft size={18} />
          </button>
          <Globe size={20} style={{ color: "var(--cyber-500)" }} />
          <h1 className="font-black text-base" style={{ color: "white" }}>Dashboard Admin</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadData()} className="p-2 rounded-xl" style={{ color: "var(--foreground-muted)", background: "var(--globe-ghost)" }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => router.push("/plus/publier")} className="wc-btn" style={{ padding: "0.4rem 0.875rem", fontSize: "0.75rem" }}>
            ✏️ Publier
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {STAT_CARDS.map(({ icon, label, value, color }) => (
            <div key={label} className="wc-card p-3 text-center">
              <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
              <p className="font-black text-xl" style={{ color: "white" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--foreground-subtle)", lineHeight: 1.2 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex gap-2 p-1.5 rounded-xl mb-4" style={{ background: "var(--globe-ghost)", border: "1px solid var(--border)" }}>
          {(["articles", "users"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all"
              style={{ background: tab === t ? "var(--gradient-btn)" : "transparent", color: tab === t ? "white" : "var(--foreground-muted)" }}>
              {t === "articles" ? `📰 Articles (${stats.articles})` : `👥 Utilisateurs (${stats.users})`}
            </button>
          ))}
        </div>

        {/* Liste articles */}
        {tab === "articles" && (
          <div className="flex flex-col gap-3">
            {articles.map((a) => {
              // ✅ CORRECTION 3 : users_profile est un tableau, on prend le premier élément
              const profile = Array.isArray(a.users_profile) ? a.users_profile[0] : a.users_profile;
              return (
                <div key={a.article_id} className="wc-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                      style={{ background: "var(--gradient-btn)" }}>
                      {getInitials(profile?.prenom ?? "U", profile?.nom ?? "")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold mb-0.5" style={{ color: "var(--foreground-muted)" }}>
                        {profile?.prenom} {profile?.nom} · {formatDate(a.date_created)}
                      </p>
                      <p className="text-sm line-clamp-2" style={{ color: "var(--foreground)", whiteSpace: "pre-wrap" }}>
                        {a.texte?.substring(0, 120)}{(a.texte?.length ?? 0) > 120 ? "…" : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>❤️ {a.reaction_love ?? 0}</span>
                        <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>👍 {a.reaction_like ?? 0}</span>
                        <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>💬 {a.comment_count ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => router.push(`/plus/publier?edit=${a.article_id}`)}
                        className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: "rgba(74,158,255,0.1)", color: "var(--cyber-400)" }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => void handleDelete(a.article_id)} disabled={deleting === a.article_id}
                        className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
                        {deleting === a.article_id ? <span className="w-3 h-3 rounded-full border border-red-400 border-t-transparent animate-spin block" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Liste utilisateurs */}
        {tab === "users" && (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.user_id} className="wc-card flex items-center gap-3 p-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ background: u.role === "admin" ? "linear-gradient(135deg, var(--cyber-500), var(--navy-400))" : "var(--gradient-btn)" }}>
                  {getInitials(u.prenom, u.nom)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "white" }}>{u.prenom} {u.nom}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: u.role === "admin" ? "rgba(74,158,255,0.15)" : "var(--globe-ghost)",
                      color: u.role === "admin" ? "var(--cyber-500)" : "var(--foreground-muted)",
                    }}>
                    {u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
