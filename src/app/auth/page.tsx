"use client";

// ═══════════════════════════════════════════════════════════════
//  src/app/auth/page.tsx
//  Converti depuis : connexion.html
//
//  Références HTML → Next.js :
//    supabaseClient.js          → createSupabaseBrowserClient()
//    window.location.href='index.html'    → router.push("/")
//    window.location.href='publier.html'  → router.push("/plus")
//    window.location.href='auth.html'     → router.push("/auth/reset")
//    redirectByRole()           → getUserProfile() + router.push() selon role
//    style.css (kaki)           → globals.css (navy/silver/cyber brand)
//    Font Awesome               → lucide-react
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Mail, Lock, User, Eye, EyeOff, ArrowRight, Github, MessageCircle, Check, AlertCircle, Info } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

// ─── Types ────────────────────────────────────────────────────
type Tab     = "connexion" | "inscription" | "reset";
type MsgType = "success" | "error" | "info";

interface Msg { text: string; type: MsgType; }

// ─── Composant message ─────────────────────────────────────────
function Alert({ msg }: { msg: Msg }) {
  const styles: Record<MsgType, { bg: string; icon: React.ReactNode }> = {
    success: { bg: "rgba(16,185,129,0.12)", icon: <Check size={16} /> },
    error:   { bg: "rgba(239,68,68,0.12)",  icon: <AlertCircle size={16} /> },
    info:    { bg: "rgba(74,158,255,0.12)", icon: <Info size={16} /> },
  };
  const colors: Record<MsgType, string> = {
    success: "var(--success)", error: "var(--danger)", info: "var(--cyber-500)"
  };
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-4 anim-fade-in"
      style={{ background: styles[msg.type].bg, color: colors[msg.type], border: `1px solid ${colors[msg.type]}33` }}>
      {styles[msg.type].icon}
      {msg.text}
    </div>
  );
}

// ─── Input brand ──────────────────────────────────────────────
function Input({ id, type = "text", placeholder, icon, required, minLength, value, onChange, suffix }:
  { id: string; type?: string; placeholder: string; icon: React.ReactNode; required?: boolean; minLength?: number; value: string; onChange: (v: string) => void; suffix?: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-subtle)" }}>
        {icon}
      </span>
      <input
        id={id} type={type} placeholder={placeholder} required={required} minLength={minLength}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm outline-none transition-all"
        style={{
          background:  "var(--navy-800)",
          border:      "1.5px solid var(--border)",
          color:       "var(--foreground)",
          fontFamily:  "var(--font-sans)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyber-500)")}
        onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--foreground-subtle)" }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────
export default function AuthPage() {
  const router   = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [tab,         setTab]         = useState<Tab>("connexion");
  const [msg,         setMsg]         = useState<Msg | null>(null);
  const [loading,     setLoading]     = useState(false);

  // Connexion
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd,  setShowLoginPwd]  = useState(false);

  // Inscription
  const [prenom,      setPrenom]      = useState("");
  const [nom,         setNom]         = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPwd,   setSignupPwd]   = useState("");
  const [showSignPwd, setShowSignPwd] = useState(false);
  const [terms,       setTerms]       = useState(false);

  // Reset
  const [resetEmail, setResetEmail] = useState("");

  function showMsg(text: string, type: MsgType) {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  }

  // ── Redirection par rôle (remplace redirectByRole() de supabaseClient.js)
  async function redirectByRole(userId: string) {
    const { data } = await supabase
      .from("users_profile")
      .select("role")
      .eq("user_id", userId)
      .single();
    // connexion.html redirige admin → publier.html (=/plus), user → index.html (=/)
    if (data?.role === "admin") router.push("/plus");
    else router.push("/");
  }

  // ── Connexion email/password (remplace le submit de #login-form)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail, password: loginPassword,
    });
    if (error) {
      showMsg(error.message.includes("Invalid login credentials")
        ? "Email ou mot de passe incorrect."
        : error.message, "error");
    } else if (data.user) {
      showMsg("Connexion réussie ! Redirection…", "success");
      setTimeout(() => void redirectByRole(data.user.id), 1200);
    }
    setLoading(false);
  }

  // ── Inscription (remplace le submit de #signup-form)
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!terms) { showMsg("Veuillez accepter les conditions d'utilisation.", "error"); return; }
    setLoading(true);
    setMsg(null);
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail, password: signupPwd,
      options: { data: { full_name: `${prenom} ${nom}`, first_name: prenom, last_name: nom } },
    });
    if (error) {
      showMsg(error.message.includes("already registered")
        ? "Cet email est déjà utilisé."
        : error.message, "error");
    } else if (data.user) {
      await new Promise((r) => setTimeout(r, 800));
      await supabase.from("users_profile").insert({
        user_id: data.user.id, prenom, nom, role: "user",
      });
      showMsg("🎉 Inscription réussie ! Vérifiez votre email.", "success");
      setTimeout(() => router.push("/"), 2500);
    }
    setLoading(false);
  }

  // ── Reset password (remplace le submit de #password-reset-form)
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      // auth.html → /auth/reset (la page de confirmation Next.js)
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset`,
    });
    if (error) showMsg(error.message, "error");
    else showMsg("📧 Email envoyé ! Vérifiez votre boîte (et les spams).", "success");
    setLoading(false);
  }

  // ── OAuth (remplace signInWithGoogle/GitHub/Discord)
  async function handleOAuth(provider: "google" | "github" | "discord") {
    showMsg(`Connexion avec ${provider} en cours…`, "info");
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/` },
    });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "connexion",   label: "Connexion" },
    { key: "inscription", label: "Inscription" },
    { key: "reset",       label: "Récupération" },
  ];

  return (
    <div className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: "var(--gradient-navy)", backgroundAttachment: "fixed" }}>

      <div className="w-full max-w-md anim-fade-in-scale">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="text-center mb-6 px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Globe size={32} style={{ color: "var(--cyber-500)", filter: "drop-shadow(0 0 8px var(--cyber-500))" }} />
            <h1 className="font-black text-3xl" style={{ color: "white", fontFamily: "var(--font-sans)", letterSpacing: "-0.03em" }}>
              World Connect
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--foreground-subtle)" }}>Le Monde connecté à l'internet</p>
          <div className="wc-chrome-line mt-3 mx-auto" style={{ maxWidth: "120px" }} />
        </div>

        {/* ── Card ────────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--navy-700)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

          {/* Onglets */}
          <div className="flex" style={{ borderBottom: "1px solid var(--border)", background: "var(--navy-800)" }}>
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => { setTab(key); setMsg(null); }}
                className={cn("flex-1 py-4 text-sm font-bold transition-all relative", tab === key ? "text-white" : "text-white/40 hover:text-white/70")}
                style={tab === key ? { fontFamily: "var(--font-sans)" } : {}}>
                {label}
                {tab === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "var(--cyber-500)", boxShadow: "0 0 8px var(--cyber-500)" }} />
                )}
              </button>
            ))}
          </div>

          <div className="p-7">
            {msg && <Alert msg={msg} />}

            {/* ── CONNEXION ─────────────────────────────── */}
            {tab === "connexion" && (
              <div className="anim-fade-in">
                <h2 className="font-black text-2xl mb-1" style={{ color: "white" }}>👋 Bon retour !</h2>
                <p className="text-sm mb-6" style={{ color: "var(--foreground-subtle)" }}>Connectez-vous pour continuer votre aventure</p>

                {/* OAuth */}
                <div className="flex flex-col gap-2 mb-5">
                  {[{ p: "google" as const, label: "Google", icon: "G" }, { p: "github" as const, label: "GitHub", icon: <Github size={16} /> }, { p: "discord" as const, label: "Discord", icon: "D" }].map(({ p, label, icon }) => (
                    <button key={p} onClick={() => void handleOAuth(p)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{ background: "var(--globe-ghost)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                      <span>{icon}</span> Continuer avec {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--foreground-subtle)" }}>ou avec email</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>

                <form onSubmit={void handleLogin} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Adresse email</label>
                    <Input id="login-email" type="email" placeholder="exemple@email.com" icon={<Mail size={15} />} required value={loginEmail} onChange={setLoginEmail} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Mot de passe</label>
                    <Input id="login-password" type={showLoginPwd ? "text" : "password"} placeholder="••••••••" icon={<Lock size={15} />} required value={loginPassword} onChange={setLoginPassword}
                      suffix={<span onClick={() => setShowLoginPwd(!showLoginPwd)}>{showLoginPwd ? <EyeOff size={15} /> : <Eye size={15} />}</span>} />
                  </div>
                  <button type="submit" disabled={loading} className="wc-btn justify-center mt-1"
                    style={{ padding: "0.875rem", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Connexion…" : "Se connecter"} <ArrowRight size={16} />
                  </button>
                </form>

                <div className="flex justify-between mt-4 flex-wrap gap-2">
                  <button onClick={() => setTab("reset")} className="text-xs font-semibold" style={{ color: "var(--cyber-400)" }}>Mot de passe oublié ?</button>
                  <button onClick={() => setTab("inscription")} className="text-xs font-semibold" style={{ color: "var(--cyber-400)" }}>Créer un compte</button>
                </div>
              </div>
            )}

            {/* ── INSCRIPTION ───────────────────────────── */}
            {tab === "inscription" && (
              <div className="anim-fade-in">
                <h2 className="font-black text-2xl mb-1" style={{ color: "white" }}>🚀 Créer un compte</h2>
                <p className="text-sm mb-6" style={{ color: "var(--foreground-subtle)" }}>Rejoignez notre communauté</p>

                <form onSubmit={void handleSignup} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Prénom</label>
                      <Input id="signup-prenom" placeholder="John" icon={<User size={15} />} required value={prenom} onChange={setPrenom} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Nom</label>
                      <Input id="signup-nom" placeholder="Doe" icon={<User size={15} />} required value={nom} onChange={setNom} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Email</label>
                    <Input id="signup-email" type="email" placeholder="exemple@email.com" icon={<Mail size={15} />} required value={signupEmail} onChange={setSignupEmail} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Mot de passe</label>
                    <Input id="signup-password" type={showSignPwd ? "text" : "password"} placeholder="••••••••" icon={<Lock size={15} />} required minLength={6} value={signupPwd} onChange={setSignupPwd}
                      suffix={<span onClick={() => setShowSignPwd(!showSignPwd)}>{showSignPwd ? <EyeOff size={15} /> : <Eye size={15} />}</span>} />
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 accent-blue-500" />
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      J'accepte les <span style={{ color: "var(--cyber-400)" }}>conditions d'utilisation</span> et la <span style={{ color: "var(--cyber-400)" }}>politique de confidentialité</span>
                    </span>
                  </label>
                  <button type="submit" disabled={loading || !terms} className="wc-btn justify-center mt-1"
                    style={{ padding: "0.875rem", opacity: loading || !terms ? 0.6 : 1 }}>
                    {loading ? "Création…" : "Créer mon compte"} <ArrowRight size={16} />
                  </button>
                </form>

                <button onClick={() => setTab("connexion")} className="w-full text-center mt-4 text-xs font-semibold" style={{ color: "var(--cyber-400)" }}>
                  Vous avez déjà un compte ? Se connecter
                </button>
              </div>
            )}

            {/* ── RESET ─────────────────────────────────── */}
            {tab === "reset" && (
              <div className="anim-fade-in">
                <h2 className="font-black text-2xl mb-1" style={{ color: "white" }}>🔐 Récupération</h2>
                <p className="text-sm mb-4" style={{ color: "var(--foreground-subtle)" }}>Nous vous enverrons un lien sécurisé</p>

                <div className="flex gap-2 p-3 rounded-xl mb-5 text-xs" style={{ background: "var(--globe-ghost)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: "2px", color: "var(--cyber-500)" }} />
                  Le lien est valable 24h et ne peut être utilisé qu'une seule fois.
                </div>

                <form onSubmit={void handleReset} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Email associé à votre compte</label>
                    <Input id="reset-email" type="email" placeholder="exemple@email.com" icon={<Mail size={15} />} required value={resetEmail} onChange={setResetEmail} />
                  </div>
                  <button type="submit" disabled={loading} className="wc-btn justify-center mt-1"
                    style={{ padding: "0.875rem", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Envoi…" : "Envoyer le lien"} <ArrowRight size={16} />
                  </button>
                </form>

                <button onClick={() => setTab("connexion")} className="w-full text-center mt-4 text-xs font-semibold" style={{ color: "var(--cyber-400)" }}>
                  ← Retour à la connexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
      }
    
