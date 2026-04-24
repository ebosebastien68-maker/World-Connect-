"use client";

// ═══════════════════════════════════════════════════════════════
//  src/components/articles/ArticleFeed.tsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter }      from "next/navigation";
import { toast }          from "sonner";
import {
  // ✅ Retiré : Wifi (importé mais jamais utilisé)
  Newspaper, WifiOff, Search, X, Globe, LogIn,
  Settings, LogOut, Pencil, Bell,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ArticleCard }    from "@/components/articles/ArticleCard";
import { getInitials }    from "@/lib/utils";
import type { Article, UserProfile, ReactionType } from "@/types/supabase";

const VAPID_PUBLIC_KEY =
  "BH3HWUJHOVhPrzNe-XeKjVTls6_iExezM7hReypIioYDh49bui2j7r60bf_aGBMOtVJ0ReiQVGVfxZDVgELmjCA";

function vapidToUint8(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: "var(--gradient-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-12 h-12 rounded-full" style={{ background: "var(--globe-ghost)" }} />
        <div className="flex-1">
          <div className="h-3 rounded-full w-32 mb-2" style={{ background: "var(--globe-ghost)" }} />
          <div className="h-2 rounded-full w-20"   style={{ background: "var(--globe-ghost)" }} />
        </div>
      </div>
      <div className="px-5 pb-4 flex flex-col gap-2">
        {[100, 90, 70].map((w, i) => (
          <div key={i} className="h-2.5 rounded-full" style={{ width: `${w}%`, background: "var(--globe-ghost)" }} />
        ))}
      </div>
    </div>
  );
}

export function ArticleFeed() {
  const router   = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [currentUser,    setCurrentUser]    = useState<{ id: string } | null>(null);
  const [userProfile,    setUserProfile]    = useState<UserProfile | null>(null);
  const [articles,       setArticles]       = useState<Article[]>([]);
  const [userReactions,  setUserReactions]  = useState<Record<string, ReactionType[]>>({});
  const [loading,        setLoading]        = useState(true);
  const [isOnline,       setIsOnline]       = useState(true);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [showWelcome,    setShowWelcome]    = useState(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [msgCount,       setMsgCount]       = useState(0);
  const [notifCount,     setNotifCount]     = useState(0);

  const swRegRef     = useRef<ServiceWorkerRegistration | null>(null);
  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Supprimer l'avertissement "msgCount assigned but never read"
  void msgCount;

  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUser({ id: session.user.id });
      const { data } = await supabase
        .from("users_profile").select("user_id,prenom,nom,role").eq("user_id", session.user.id).single();
      if (data) setUserProfile(data as UserProfile);
    })();
  }, [supabase]);

  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  toast.success("Connexion rétablie"); };
    const goOffline = () => { setIsOnline(false); toast.warning("Vous êtes hors ligne"); };
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/service-worker.js").then((reg) => {
      swRegRef.current = reg;
    });
  }, []);

  const loadArticles = useCallback(async () => {
    if (!isOnline) return;
    const { data, error } = await supabase
      .from("articles")
      .select(`*, users_profile!articles_user_id_fkey(prenom, nom), article_images(image_url), article_videos(video_url)`)
      .order("date_created", { ascending: false });
    if (error) { toast.error("Erreur de chargement"); return; }
    setArticles((data as Article[]) ?? []);
    setLoading(false);
  }, [isOnline, supabase]);

  useEffect(() => { void loadArticles(); }, [loadArticles]);

  const loadUserReactions = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("article_reactions").select("article_id, reaction_type").eq("user_id", currentUser.id);
    const map: Record<string, ReactionType[]> = {};
    (data ?? []).forEach((r: { article_id: string; reaction_type: ReactionType }) => {
      if (!map[r.article_id]) map[r.article_id] = [];
      (map[r.article_id] as ReactionType[]).push(r.reaction_type);
    });
    setUserReactions(map);
  }, [currentUser, supabase]);

  useEffect(() => { void loadUserReactions(); }, [loadUserReactions]);

  const loadCounts = useCallback(async () => {
    if (!currentUser) return;
    const [{ count: n }, { count: m }] = await Promise.all([
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", currentUser.id).eq("read_status", false),
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("receiver_id", currentUser.id).eq("read_status", false),
    ]);
    setNotifCount(n ?? 0);
    setMsgCount(m ?? 0);
  }, [currentUser, supabase]);

  useEffect(() => {
    if (!currentUser) return;
    const ch = supabase.channel("feed-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => void loadArticles())
      .on("postgres_changes", { event: "*", schema: "public", table: "article_reactions" }, () => { void loadUserReactions(); void loadArticles(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions_commentaires" }, () => void loadArticles())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUser.id}` }, () => void loadCounts())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${currentUser.id}` }, () => void loadCounts())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [currentUser, supabase, loadArticles, loadUserReactions, loadCounts]);

  useEffect(() => { void loadCounts(); }, [loadCounts]);

  useEffect(() => {
    const id = setInterval(() => void loadCounts(), 30000);
    return () => clearInterval(id);
  }, [loadCounts]);

  useEffect(() => {
    const onVisible = () => { if (!document.hidden && currentUser) { void loadCounts(); void loadArticles(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [currentUser, loadCounts, loadArticles]);

  useEffect(() => {
    if (!userProfile) return;
    const shown = sessionStorage.getItem("welcomeShown");
    if (shown) return;
    sessionStorage.setItem("welcomeShown", "true");
    setShowWelcome(true);
    setTimeout(() => setShowWelcome(false), 3500);
  }, [userProfile]);

  async function requestPush() {
    if (!currentUser || !userProfile) return;
    if (!("Notification" in window) || !("PushManager" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted" || !swRegRef.current) return;
    try {
      const sub = await swRegRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidToUint8(VAPID_PUBLIC_KEY),
      });
      await supabase.from("subscriptions").upsert({
        user_id:     currentUser.id,
        endpoint:    sub.endpoint,
        p256dh_key:  btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
        auth_key:    btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
        device_type: "web",
      }, { onConflict: "user_id,endpoint" });
      toast.success("Notifications activées !");
    } catch { /* micro non autorisé */ }
  }

  useEffect(() => {
    if (!currentUser || !userProfile) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      setTimeout(() => void requestPush(), 3000);
    }
  }, [currentUser, userProfile]);

  async function handleLogout() {
    sessionStorage.removeItem("welcomeShown");
    await supabase.auth.signOut();
    router.push("/auth");
  }

  function openMenu() {
    setMenuOpen(true);
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    menuTimerRef.current = setTimeout(() => setMenuOpen(false), 5000);
  }

  function closeMenu() {
    setMenuOpen(false);
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
  }

  const filtered = searchQuery.trim()
    ? articles.filter((a) => {
        const text   = (a.texte ?? "").toLowerCase();
        const author = `${a.users_profile?.prenom ?? ""} ${a.users_profile?.nom ?? ""}`.toLowerCase();
        return text.includes(searchQuery.toLowerCase()) || author.includes(searchQuery.toLowerCase());
      })
    : articles;

  return (
    <>
      {!isOnline && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold"
          style={{ background: "var(--danger)", color: "white", boxShadow: "var(--shadow-lg)" }}>
          <WifiOff size={14} /> Vous êtes hors ligne
        </div>
      )}

      {showWelcome && userProfile && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: "rgba(7,15,43,0.7)", backdropFilter: "blur(8px)" }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center px-10 py-10 rounded-3xl anim-fade-in-scale"
            style={{ background: "var(--gradient-btn)", boxShadow: "var(--shadow-lg)", minWidth: "280px" }}>
            <div className="text-5xl mb-4">👋</div>
            <p className="text-white/80 text-sm mb-1 font-medium">Bienvenue sur World Connect</p>
            <p className="text-white font-black text-2xl mb-2">{userProfile.prenom} {userProfile.nom}</p>
            <p className="text-white/70 text-xs">Nous sommes disponibles à tous vos Services.</p>
          </div>
        </>
      )}

      <header style={{ position: "sticky", top: 0, zIndex: 40, padding: "0 1rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(13,31,78,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <button onClick={openMenu} className="flex items-center gap-2">
          <Globe size={24} style={{ color: "var(--cyber-500)", filter: "drop-shadow(0 0 6px var(--cyber-500))" }} />
          <span className="font-black text-lg" style={{ color: "white", letterSpacing: "-0.02em" }}>World Connect</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-xl transition-all"
            style={{ background: searchOpen ? "var(--cyber-500)" : "var(--globe-ghost)", color: searchOpen ? "var(--navy-950)" : "var(--foreground-muted)" }}>
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          {currentUser && (
            <button onClick={() => void requestPush()} className="p-2 rounded-xl"
              style={{ background: "var(--globe-ghost)", color: "var(--foreground-muted)" }}>
              <Bell size={18} />
            </button>
          )}
        </div>
      </header>

      {searchOpen && (
        <div className="px-4 py-3 anim-slide-up" style={{ background: "rgba(13,31,78,0.85)", borderBottom: "1px solid var(--border)" }}>
          <div className="relative max-w-xl mx-auto">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-subtle)" }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mots-clés, auteur…" autoFocus
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "var(--navy-800)", border: "1.5px solid var(--cyber-500)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
            />
          </div>
          {searchQuery && (
            <p className="text-xs text-center mt-2" style={{ color: "var(--foreground-subtle)" }}>
              {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} style={{ background: "rgba(7,15,43,0.5)", backdropFilter: "blur(4px)" }} />
          <nav className="fixed top-0 left-0 bottom-0 z-50 flex flex-col anim-slide-up w-72"
            style={{ background: "var(--navy-800)", borderRight: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex items-center gap-3 px-5 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
              <Globe size={28} style={{ color: "var(--cyber-500)" }} />
              <span className="font-black text-xl" style={{ color: "white" }}>World Connect</span>
            </div>
            {userProfile && (
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: "var(--gradient-btn)" }}>
                  {getInitials(userProfile.prenom, userProfile.nom)}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "white" }}>{userProfile.prenom} {userProfile.nom}</p>
                  <p className="text-xs" style={{ color: "var(--cyber-500)" }}>{userProfile.role}</p>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              {!currentUser && (
                <NavItem icon={<LogIn size={18} />} label="Connexion" onClick={() => { router.push("/auth"); closeMenu(); }} />
              )}
              {userProfile?.role === "admin" && (
                <NavItem icon={<Pencil size={18} />} label="Administration" onClick={() => { router.push("/plus"); closeMenu(); }} badge={0} />
              )}
              <NavItem icon={<Bell size={18} />} label="Notifications" onClick={() => { router.push("/notifications"); closeMenu(); }} badge={notifCount} />
              <NavItem icon={<Settings size={18} />} label="Paramètres" onClick={() => { router.push("/settings"); closeMenu(); }} />
              {currentUser && (
                <NavItem icon={<LogOut size={18} />} label="Déconnexion" onClick={() => { void handleLogout(); closeMenu(); }} danger />
              )}
            </div>
            <div className="wc-chrome-line mx-5 mb-4" />
          </nav>
        </>
      )}

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "1.25rem 1rem" }}>
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Newspaper size={64} style={{ color: "var(--foreground-subtle)", opacity: 0.4 }} />
            <h2 className="font-bold text-xl" style={{ color: "var(--foreground-muted)" }}>
              {searchQuery ? "Aucun résultat" : "Aucun article"}
            </h2>
            <p className="text-sm text-center" style={{ color: "var(--foreground-subtle)" }}>
              {searchQuery ? `Pas d'article pour "${searchQuery}"` : "Revenez plus tard"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filtered.map((article) => (
              <ArticleCard
                key={article.article_id}
                article={article}
                currentUser={currentUser}
                userProfile={userProfile}
                userReactions={userReactions[article.article_id] ?? []}
                onDeleted={() => void loadArticles()}
                onReacted={() => { void loadArticles(); void loadUserReactions(); }}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function NavItem({ icon, label, onClick, badge, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; badge?: number; danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.01]"
      style={{ background: "var(--globe-ghost)", color: danger ? "var(--danger)" : "var(--foreground-muted)", border: "1px solid var(--border-light)" }}>
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {(badge ?? 0) > 0 && <span className="wc-badge">{badge}</span>}
    </button>
  );
}

