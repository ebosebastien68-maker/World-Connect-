"use client";

// ═══════════════════════════════════════════════════════════════
//  notifications/page.tsx — converti depuis notifications.html
//  Utilise globals.css + tailwind.config.ts (palette World Connect)
//  Pas de Three.js — fond géré par globals.css (--gradient-navy)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Check, CheckCheck, Trash2, Heart, MessageCircle, Reply, Newspaper, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/lib/supabase/mutations";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface Notification {
  notification_id: string;
  user_id:         string;
  texte:           string;
  read_status:     boolean;
  date_created:    string;
}

type Filter = "all" | "unread" | "read";

// ─── Helpers ──────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `Il y a ${d} jour${d > 1 ? "s" : ""}`;
  if (h > 0)  return `Il y a ${h}h`;
  if (m > 0)  return `Il y a ${m} min`;
  return "À l'instant";
}

function getIcon(text: string) {
  const t = text.toLowerCase();
  if (t.includes("réaction"))   return { Icon: Heart,          color: "#ec4899" };
  if (t.includes("commentaire")) return { Icon: MessageCircle, color: "var(--success)" };
  if (t.includes("réponse"))    return { Icon: Reply,          color: "var(--warning)" };
  if (t.includes("article"))    return { Icon: Newspaper,      color: "var(--cyber-400)" };
  if (t.includes("message"))    return { Icon: Mail,           color: "var(--cyber-500)" };
  return { Icon: Bell, color: "var(--silver-400)" };
}

// ─── Composant ────────────────────────────────────────────────
export default function NotificationsPage() {
  const supabase = createSupabaseBrowserClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<Filter>("all");
  const [userId, setUserId]               = useState<string | null>(null);

  // ── Auth ──────────────────────────────────────────────────
  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/"; return; }
      setUserId(session.user.id);
    });
  }, [supabase]);

  // ── Chargement ────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("date_created", { ascending: false });
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => { void load(); }, [load]);

  // Polling 10s
  useEffect(() => {
    const id = setInterval(() => void load(), 10000);
    return () => clearInterval(id);
  }, [load]);

  // ── Actions ───────────────────────────────────────────────
  async function handleRead(id: string) {
    await markNotificationRead(supabase, id);
    void load();
  }

  async function handleMarkAll() {
    if (!userId) return;
    await markAllNotificationsRead(supabase, userId);
    void load();
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Supprimer cette notification ?")) return;
    await deleteNotification(supabase, id);
    void load();
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read_status;
    if (filter === "read")   return n.read_status;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  const TABS: { key: Filter; label: string }[] = [
    { key: "all",    label: "Toutes" },
    { key: "unread", label: "Non lues" },
    { key: "read",   label: "Lues" },
  ];

  return (
    <div className="wc-page">

      {/* ── Header sticky ─────────────────────────────────── */}
      <header
        style={{
          position:       "sticky", top: 0, zIndex: 40,
          padding:        "0 1rem",
          height:         "60px",
          display:        "flex", alignItems: "center", justifyContent: "space-between",
          background:     "rgba(13,31,78,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom:   "1px solid var(--border)",
          boxShadow:      "var(--shadow-md)",
        }}
      >
        <div className="flex items-center gap-2">
          <Bell size={20} style={{ color: "var(--cyber-500)" }} />
          <h1 className="font-black text-lg" style={{ color: "white", letterSpacing: "-0.02em" }}>
            Notifications
            {unreadCount > 0 && (
              <span className="wc-badge ml-2" style={{ fontSize: "0.65rem" }}>{unreadCount}</span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="wc-btn" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
            <CheckCheck size={14} /> Tout marquer lu
          </button>
        )}
      </header>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* ── Ligne chrome ──────────────────────────────── */}
        <div className="wc-chrome-line mb-5" />

        {/* ── Onglets filtre ────────────────────────────── */}
        <div
          className="flex gap-2 p-1.5 rounded-xl mb-5"
          style={{ background: "var(--globe-ghost)", border: "1px solid var(--border)" }}
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                filter === key
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              )}
              style={filter === key ? {
                background: "var(--gradient-btn)",
                boxShadow:  "var(--shadow-cyber)",
              } : {}}
            >
              {label}
              {key === "unread" && unreadCount > 0 && (
                <span className="wc-badge ml-2" style={{ fontSize: "0.6rem" }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Info barre ────────────────────────────────── */}
        <div
          className="flex justify-between items-center px-4 py-3 rounded-xl mb-5"
          style={{ background: "var(--globe-ghost)", border: "1px solid var(--border)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
            {filter === "all" ? "Toutes les notifications"
              : filter === "unread" ? "Non lues"
              : "Lues"}
          </span>
          <span className="wc-badge">{filtered.length}</span>
        </div>

        {/* ── Contenu ───────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--cyber-500)", borderTopColor: "transparent" }} />
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <BellOff size={64} style={{ color: "var(--foreground-subtle)" }} />
            <h3 className="font-bold text-xl" style={{ color: "var(--foreground-muted)" }}>
              Aucune notification
            </h3>
            <p className="text-sm text-center" style={{ color: "var(--foreground-subtle)" }}>
              Vous n'avez reçu aucune notification pour le moment
            </p>
          </div>

        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((notif) => {
              const { Icon, color } = getIcon(notif.texte);
              return (
                <div
                  key={notif.notification_id}
                  onClick={() => !notif.read_status && void handleRead(notif.notification_id)}
                  className={cn(
                    "wc-card flex gap-4 items-start p-4 cursor-pointer transition-all",
                    !notif.read_status && "anim-fade-in"
                  )}
                  style={!notif.read_status ? {
                    borderLeftWidth:  "3px",
                    borderLeftColor:  "var(--cyber-500)",
                    background:       "rgba(26,48,112,0.6)",
                  } : {}}
                >
                  {/* Icône */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}22`, color }}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed mb-2"
                      style={{ color: "var(--foreground)", whiteSpace: "pre-wrap" }}>
                      {notif.texte}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                        {timeAgo(notif.date_created)}
                      </span>
                      {!notif.read_status && (
                        <span
                          className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                          style={{
                            background:   "var(--cyber-500)",
                            color:        "var(--navy-950)",
                            letterSpacing:"0.05em",
                            fontSize:     "0.6rem",
                          }}
                        >
                          Nouveau
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={(e) => void handleDelete(notif.notification_id, e)}
                    className="p-2 rounded-lg transition-all hover:scale-110"
                    style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
        }
        
