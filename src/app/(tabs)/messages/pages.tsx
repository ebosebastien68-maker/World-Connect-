"use client";

// ═══════════════════════════════════════════════════════════════
//  messages/page.tsx — converti depuis messages.html
//  Utilise globals.css + tailwind.config.ts
//  Pas de Three.js — fond géré par globals.css
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Globe, List, UserPlus, Send, X,
  ChevronLeft, MessageCircle, MicOff,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sendTextMessage, markMessagesRead } from "@/lib/supabase/mutations";
import { getInitials, cn } from "@/lib/utils";
import type { UserProfile, Message } from "@/types/supabase";

// ─── Types locaux ─────────────────────────────────────────────
interface Conversation {
  user:        UserProfile;
  lastMessage: Message;
  unread:      number;
}

// ─── Helpers ──────────────────────────────────────────────────
function Avatar({ prenom, nom, size = "md" }: { prenom: string; nom: string; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "w-9 h-9 text-sm", md: "w-11 h-11 text-base", lg: "w-14 h-14 text-lg" }[size];
  return (
    <div className={cn("flex items-center justify-center rounded-full font-bold flex-shrink-0 text-white", s)}
      style={{ background: "var(--gradient-btn)", boxShadow: "var(--shadow-cyber)" }}>
      {getInitials(prenom, nom)}
    </div>
  );
}

function formatMsgTime(dateStr: string): string {
  const d = new Date(dateStr), now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000)     return "À l'instant";
  if (diff < 3600000)   return `${Math.floor(diff / 60000)} min`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatMsgHour(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Composant principal ──────────────────────────────────────
export default function MessagesPage() {
  const supabase = createSupabaseBrowserClient();

  const [currentUser, setCurrentUser]         = useState<{ id: string } | null>(null);
  const [userProfile, setUserProfile]         = useState<UserProfile | null>(null);
  const [conversations, setConversations]     = useState<Conversation[]>([]);
  const [contacts, setContacts]               = useState<UserProfile[]>([]);
  const [chatUser, setChatUser]               = useState<UserProfile | null>(null);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [input, setInput]                     = useState("");
  const [sending, setSending]                 = useState(false);
  const [showConvModal, setShowConvModal]     = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [searchConv, setSearchConv]           = useState("");
  const [searchContact, setSearchContact]     = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef     = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Auth & profil ────────────────────────────────────────
  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/"; return; }
      setCurrentUser({ id: session.user.id });
      const { data } = await supabase.from("users_profile").select("user_id,prenom,nom,role").eq("user_id", session.user.id).single();
      if (data) setUserProfile(data as UserProfile);
    })();
  }, [supabase]);

  // ── Conversations ────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    const [sent, received] = await Promise.all([
      supabase.from("messages").select("*").eq("sender_id", currentUser.id).order("date_created", { ascending: false }).limit(100),
      supabase.from("messages").select("*").eq("receiver_id", currentUser.id).order("date_created", { ascending: false }).limit(100),
    ]);
    const all = [...(sent.data ?? []), ...(received.data ?? [])] as Message[];
    const ids = [...new Set(all.map((m) => m.sender_id === currentUser.id ? m.receiver_id : m.sender_id))];
    if (!ids.length) return;
    const { data: users } = await supabase.from("users_profile").select("*").in("user_id", ids);
    const usersMap = Object.fromEntries((users ?? []).map((u: UserProfile) => [u.user_id, u]));
    const map: Record<string, Conversation> = {};
    all.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
      .forEach((m) => {
        const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
        const u = usersMap[otherId];
        if (!u) return;
        if (userProfile?.role === "user" && u.role !== "admin") return;
        if (!map[otherId]) map[otherId] = { user: u, lastMessage: m, unread: 0 };
        if (m.receiver_id === currentUser.id && !m.read_status) map[otherId].unread++;
      });
    setConversations(Object.values(map).sort((a, b) =>
      new Date(b.lastMessage.date_created).getTime() - new Date(a.lastMessage.date_created).getTime()
    ));
  }, [currentUser, supabase, userProfile]);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  // ── Contacts ─────────────────────────────────────────────
  async function loadContacts() {
    if (!currentUser) return;
    const role = userProfile?.role === "user" ? "admin" : null;
    let q = supabase.from("users_profile").select("*").neq("user_id", currentUser.id).order("prenom").limit(100);
    if (role) q = q.eq("role", role);
    const { data } = await q;
    setContacts((data as UserProfile[]) ?? []);
  }

  // ── Messages ─────────────────────────────────────────────
  const loadMessages = useCallback(async (otherId: string) => {
    if (!currentUser) return;
    const [s, r] = await Promise.all([
      supabase.from("messages").select("*").eq("sender_id", currentUser.id).eq("receiver_id", otherId).order("date_created"),
      supabase.from("messages").select("*").eq("sender_id", otherId).eq("receiver_id", currentUser.id).order("date_created"),
    ]);
    const all = [...(s.data ?? []), ...(r.data ?? [])] as Message[];
    all.sort((a, b) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());
    setMessages(all);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [currentUser, supabase]);

  // ── Ouvrir chat ───────────────────────────────────────────
  async function openChat(user: UserProfile) {
    setChatUser(user);
    if (!currentUser) return;
    await loadMessages(user.user_id);
    await markMessagesRead(supabase, user.user_id, currentUser.id);
    void loadConversations();
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`chat:${currentUser.id}:${user.user_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (p) => {
        const n = p.new as Message;
        if ((n.sender_id === user.user_id && n.receiver_id === currentUser.id) ||
            (n.sender_id === currentUser.id && n.receiver_id === user.user_id)) {
          await loadMessages(user.user_id);
          if (n.receiver_id === currentUser.id) await markMessagesRead(supabase, user.user_id, currentUser.id);
          void loadConversations();
        }
      })
      .subscribe();
  }

  // ── Envoyer ───────────────────────────────────────────────
  async function handleSend() {
    if (!currentUser || !chatUser || !input.trim() || sending) return;
    setSending(true);
    await sendTextMessage(supabase, currentUser.id, chatUser.user_id, input.trim());
    setInput("");
    setSending(false);
  }

  const filteredConv     = conversations.filter((c) => `${c.user.prenom} ${c.user.nom}`.toLowerCase().includes(searchConv.toLowerCase()));
  const filteredContacts = contacts.filter((c) => `${c.prenom} ${c.nom}`.toLowerCase().includes(searchContact.toLowerCase()));

  return (
    <div className="wc-page flex flex-col" style={{ minHeight: "100dvh" }}>

      {/* ── Header ──────────────────────────────────────── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 40,
          padding: "0 1rem", height: "60px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(13,31,78,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="flex items-center gap-2">
          <Globe size={20} style={{ color: "var(--cyber-500)" }} />
          <h1 className="font-black text-lg" style={{ color: "white", letterSpacing: "-0.02em" }}>
            {chatUser ? (
              <span className="flex items-center gap-2">
                <button onClick={() => setChatUser(null)} style={{ color: "var(--cyber-500)" }}>
                  <ChevronLeft size={20} />
                </button>
                {chatUser.prenom} {chatUser.nom}
              </span>
            ) : "Messages"}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowConvModal(true); void loadConversations(); }}
            className="wc-btn" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}>
            <List size={14} /> Convs
          </button>
          <button onClick={() => { setShowContactModal(true); void loadContacts(); }}
            className="wc-btn" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}>
            <UserPlus size={14} /> Contacts
          </button>
        </div>
      </header>

      {/* ── Corps ───────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden" style={{ display: "flex", flexDirection: "column" }}>

        {!chatUser ? (
          /* État vide */
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
            <MessageCircle size={64} style={{ color: "var(--foreground-subtle)" }} />
            <h2 className="font-bold text-xl text-center" style={{ color: "var(--foreground-muted)" }}>
              Sélectionnez une conversation
            </h2>
            <p className="text-sm text-center" style={{ color: "var(--foreground-subtle)" }}>
              Ouvrez "Convs" ou "Contacts" pour démarrer
            </p>
          </div>
        ) : (
          /* Chat actif */
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {messages.map((msg) => {
                const isSent = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.message_id} className={cn("flex", isSent ? "justify-end" : "justify-start")}>
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-3 text-sm"
                      style={{
                        background: isSent ? "var(--gradient-btn)" : "var(--navy-700)",
                        color:      "white",
                        boxShadow:  isSent ? "var(--shadow-cyber)" : "var(--shadow-sm)",
                        borderBottomRightRadius: isSent ? "4px" : undefined,
                        borderBottomLeftRadius:  !isSent ? "4px" : undefined,
                      }}
                    >
                      {msg.texte && (
                        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{msg.texte}</p>
                      )}
                      <div className="flex justify-end mt-1">
                        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>
                          {formatMsgHour(msg.date_created)}
                          {isSent && (msg.read_status ? " ✓✓" : " ✓")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone saisie */}
            <div
              className="px-4 py-3 flex gap-3 items-end"
              style={{ background: "rgba(13,31,78,0.9)", borderTop: "1px solid var(--border)", backdropFilter: "blur(20px)" }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                placeholder="Aa"
                rows={1}
                className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "var(--navy-800)",
                  border:     "1px solid var(--border)",
                  color:      "var(--foreground)",
                  fontFamily: "var(--font-sans)",
                  maxHeight:  "120px",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyber-500)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <button
                onClick={void handleSend}
                disabled={!input.trim() || sending}
                className="wc-btn rounded-full"
                style={{
                  width: "44px", height: "44px", padding: 0,
                  opacity: !input.trim() ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Modal conversations ──────────────────────────── */}
      {showConvModal && (
        <Modal title="Conversations" onClose={() => setShowConvModal(false)}>
          <input value={searchConv} onChange={(e) => setSearchConv(e.target.value)}
            placeholder="Rechercher…" className="wc-search-input" />
          {filteredConv.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--foreground-subtle)" }}>Aucune conversation</p>
          ) : filteredConv.map((c) => (
            <button key={c.user.user_id}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
              style={{ background: "var(--globe-ghost)", border: "1px solid var(--border)", marginBottom: "0.5rem" }}
              onClick={() => { void openChat(c.user); setShowConvModal(false); }}
            >
              <Avatar prenom={c.user.prenom} nom={c.user.nom} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                    {c.user.prenom} {c.user.nom}
                  </span>
                  <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                    {formatMsgTime(c.lastMessage.date_created)}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>
                  {c.lastMessage.texte ?? "📎 Fichier"}
                </p>
              </div>
              {c.unread > 0 && <span className="wc-badge">{c.unread}</span>}
            </button>
          ))}
        </Modal>
      )}

      {/* ── Modal contacts ──────────────────────────────── */}
      {showContactModal && (
        <Modal title="Contacts" onClose={() => setShowContactModal(false)}>
          <input value={searchContact} onChange={(e) => setSearchContact(e.target.value)}
            placeholder="Rechercher…" className="wc-search-input" />
          {filteredContacts.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--foreground-subtle)" }}>Aucun contact</p>
          ) : filteredContacts.map((u) => (
            <button key={u.user_id}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
              style={{ background: "var(--globe-ghost)", border: "1px solid var(--border)", marginBottom: "0.5rem" }}
              onClick={() => { void openChat(u); setShowContactModal(false); }}
            >
              <Avatar prenom={u.prenom} nom={u.nom} />
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{u.prenom} {u.nom}</p>
                <p className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                  {u.role === "admin" ? "Administrateur" : "Utilisateur"}
                </p>
              </div>
            </button>
          ))}
        </Modal>
      )}
    </div>
  );
}

// ─── Modale réutilisable ──────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(7,15,43,0.8)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-t-3xl p-5 anim-slide-up"
        style={{
          background:  "var(--navy-700)",
          border:      "1px solid var(--border)",
          boxShadow:   "var(--shadow-lg)",
          maxHeight:   "80dvh",
          overflow:    "hidden",
          display:     "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-lg" style={{ color: "var(--foreground)" }}>{title}</h3>
          <button onClick={onClose} style={{ color: "var(--foreground-subtle)" }}><X size={20} /></button>
        </div>
        <div className="wc-chrome-line mb-4" />
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
