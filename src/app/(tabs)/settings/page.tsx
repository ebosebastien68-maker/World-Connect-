"use client";

// ═══════════════════════════════════════════════════════════════
//  src/app/(tabs)/settings/page.tsx
//  Converti depuis : parametre.html
//
//  Références HTML → Next.js :
//    supabaseClient.js          → createSupabaseBrowserClient()
//    getCurrentUser()           → supabase.auth.getSession()
//    getUserProfile()           → supabase.from("users_profile")
//    window.location.href='connexion.html' → router.push("/auth")
//    window.location.href='index.html'     → router.push("/")
//    Three.js                   → retiré (fond via globals.css)
//    Font Awesome               → lucide-react
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, User, AlertTriangle, Save, Trash2, Eye, EyeOff, Check, X, Globe } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/supabase";

// ── Chaîne de vérification (identique à parametre.html)
const VERIFICATION_STRING =
  "₽ o hn ₹ ₿₱ ¶v; \"(t\" ><æ₿β ϟϛχ ποιι θετψψ ηφσϟνχ ζδσξλππ φδρψη κξγφϛ βνμκ ϡλλπο γφζϛϛφθσ ∩∋∈→8≡⊷ εε∨ ⊥∡⌀∞∞ℝℕ∇ 23ϡ⊗⊙⊖⊕∀789↕↑↔∨∧⌈⌉∡⌀√";

export default function SettingsPage() {
  const router   = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [currentUser,  setCurrentUser]  = useState<{ id: string; email: string } | null>(null);
  const [userProfile,  setUserProfile]  = useState<UserProfile | null>(null);
  const [prenom,       setPrenom]       = useState("");
  const [nom,          setNom]          = useState("");
  const [currentPwd,   setCurrentPwd]   = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [updateMsg,    setUpdateMsg]    = useState<{ text: string; ok: boolean } | null>(null);
  const [updLoading,   setUpdLoading]   = useState(false);

  // Zone suppression
  const [verifyInput,  setVerifyInput]  = useState("");
  const [verified,     setVerified]     = useState(false);
  const [deletePwd,    setDeletePwd]    = useState("");
  const [deleteMsg,    setDeleteMsg]    = useState<{ text: string; ok: boolean } | null>(null);
  const [delLoading,   setDelLoading]   = useState(false);

  // ── Auth + profil (remplace initSettings())
  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }
      setCurrentUser({ id: session.user.id, email: session.user.email ?? "" });

      const { data } = await supabase
        .from("users_profile").select("user_id,prenom,nom,role").eq("user_id", session.user.id).single();
      if (data) {
        setUserProfile(data as UserProfile);
        setPrenom(data.prenom);
        setNom(data.nom);
      }

      // Temps réel profil (remplace subscribeToProfile())
      const ch = supabase.channel(`profile-${session.user.id}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users_profile", filter: `user_id=eq.${session.user.id}` },
          (p) => { setPrenom(p.new.prenom); setNom(p.new.nom); })
        .subscribe();
      return () => supabase.removeChannel(ch);
    })();
  }, [router, supabase]);

  // ── Mise à jour profil (remplace submit de #update-profile-form)
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !currentPwd) return;
    setUpdLoading(true);
    setUpdateMsg(null);
    try {
      // Vérifier le mot de passe actuel (remplace verifyPassword())
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: currentPwd });
      if (authErr) throw new Error("Mot de passe incorrect.");
      const { error } = await supabase.from("users_profile").update({ prenom, nom }).eq("user_id", currentUser.id);
      if (error) throw error;
      setUpdateMsg({ text: "Profil mis à jour avec succès.", ok: true });
      setCurrentPwd("");
    } catch (err: unknown) {
      setUpdateMsg({ text: err instanceof Error ? err.message : "Erreur lors de la mise à jour.", ok: false });
    }
    setUpdLoading(false);
  }

  // ── Vérifier la chaîne (remplace verify-btn click)
  function handleVerify() {
    if (verifyInput.trim() === VERIFICATION_STRING.trim()) setVerified(true);
    else setDeleteMsg({ text: "La chaîne ne correspond pas. Réessayez.", ok: false });
  }

  // ── Supprimer compte (remplace delete-btn click)
  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !deletePwd || !verified) return;
    setDelLoading(true);
    setDeleteMsg(null);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: deletePwd });
      if (authErr) throw new Error("Mot de passe incorrect.");
      await supabase.from("users_profile").delete().eq("user_id", currentUser.id);
      await supabase.auth.signOut();
      setDeleteMsg({ text: "Compte supprimé. Redirection…", ok: true });
      setTimeout(() => router.push("/auth"), 1500);
    } catch (err: unknown) {
      setDeleteMsg({ text: err instanceof Error ? err.message : "Erreur lors de la suppression.", ok: false });
    }
    setDelLoading(false);
  }

  if (!currentUser) {
    return (
      <div className="wc-page flex items-center justify-center min-h-dvh">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--cyber-500)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="wc-page">
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, padding: "0 1rem", height: "60px", display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(13,31,78,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <Globe size={20} style={{ color: "var(--cyber-500)" }} />
        <h1 className="font-black text-lg" style={{ color: "white", letterSpacing: "-0.02em" }}>Paramètres</h1>
      </header>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "1.5rem 1rem" }}>

        {/* ── Section profil ───────────────────────────── */}
        <section className="wc-card p-6 mb-5 anim-slide-up">
          <h2 className="flex items-center gap-2 font-bold text-lg mb-5 pb-4" style={{ color: "white", borderBottom: "1px solid var(--border)" }}>
            <User size={20} style={{ color: "var(--cyber-500)" }} />
            Modifier le profil
          </h2>

          <form onSubmit={void handleUpdateProfile} className="flex flex-col gap-4">
            {["Prénom", "Nom"].map((label, i) => {
              const val = i === 0 ? prenom : nom;
              const set = i === 0 ? setPrenom : setNom;
              return (
                <div key={label}>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>{label}</label>
                  <input value={val} onChange={(e) => set(e.target.value)} required
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "var(--navy-800)", border: "1.5px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyber-500)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              );
            })}

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Mot de passe actuel (obligatoire)</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full px-4 pr-11 py-3.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "var(--navy-800)", border: "1.5px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyber-500)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-subtle)" }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {updateMsg && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{ background: updateMsg.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: updateMsg.ok ? "var(--success)" : "var(--danger)" }}>
                {updateMsg.ok ? <Check size={14} /> : <X size={14} />} {updateMsg.text}
              </div>
            )}

            <button type="submit" disabled={updLoading} className="wc-btn justify-center" style={{ padding: "0.875rem", opacity: updLoading ? 0.7 : 1 }}>
              <Save size={16} /> {updLoading ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </form>
        </section>

        {/* ── Zone dangereuse ───────────────────────────── */}
        <section className="p-6 rounded-2xl anim-slide-up anim-delay-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.35)", boxShadow: "var(--shadow-md)" }}>
          <h2 className="flex items-center gap-2 font-bold text-lg mb-4 pb-4" style={{ color: "var(--danger)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle size={20} /> Zone dangereuse
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
            La suppression est irréversible. Toutes vos données seront définitivement perdues.
          </p>
          <p className="text-sm mb-3" style={{ color: "var(--foreground-muted)" }}>
            Pour confirmer, tapez <strong style={{ color: "var(--danger)" }}>exactement</strong> la chaîne suivante (sans copier-coller) :
          </p>

          {/* Chaîne de vérification */}
          <div className="p-4 rounded-xl mb-4 text-xs font-mono leading-relaxed select-none"
            style={{ background: "var(--navy-900)", border: "1.5px solid rgba(239,68,68,0.25)", color: "var(--foreground)", wordBreak: "break-all", userSelect: "none" }}>
            {VERIFICATION_STRING}
          </div>

          {!verified ? (
            <div className="flex flex-col gap-3">
              <input value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Tapez la chaîne ici…"
                onPaste={(e) => e.preventDefault()}
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--navy-900)", border: "1.5px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
              />
              {deleteMsg && !verified && (
                <p className="text-xs" style={{ color: "var(--danger)" }}>{deleteMsg.text}</p>
              )}
              <button onClick={handleVerify} className="wc-btn justify-center"
                style={{ padding: "0.875rem", background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
                <Check size={16} /> Vérifier la chaîne
              </button>
            </div>
          ) : (
            <form onSubmit={void handleDelete} className="flex flex-col gap-3 anim-fade-in">
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>
                <Check size={14} /> Chaîne vérifiée. Confirmez avec votre mot de passe.
              </div>
              <input type="password" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} required
                placeholder="Votre mot de passe"
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--navy-900)", border: "1.5px solid rgba(239,68,68,0.4)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
              />
              {deleteMsg && (
                <p className="text-xs" style={{ color: deleteMsg.ok ? "var(--success)" : "var(--danger)" }}>{deleteMsg.text}</p>
              )}
              <button type="submit" disabled={delLoading} className="wc-btn justify-center"
                style={{ padding: "0.875rem", background: "linear-gradient(135deg, var(--danger), #dc2626)", opacity: delLoading ? 0.7 : 1 }}>
                <Trash2 size={16} /> {delLoading ? "Suppression…" : "Supprimer définitivement mon compte"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
  }
              
