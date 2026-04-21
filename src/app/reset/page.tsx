"use client";

// ═══════════════════════════════════════════════════════════════
//  src/app/auth/reset/page.tsx
//  Converti depuis : auth.html (réinitialisation mot de passe)
//
//  Références HTML → Next.js :
//    supabaseClient.js   → createSupabaseBrowserClient()
//    connexion.html      → router.push("/auth")
//    window.location.hash (token)  → même logique via supabase.auth
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Globe } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router   = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [state,       setState]       = useState<"loading" | "form" | "error" | "success">("loading");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  // ── Vérifier la session de récupération (remplace verifyRecoverySession())
  useEffect(() => {
    const checkSession = async () => {
      // Supabase SSR gère le token depuis l'URL automatiquement
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setState("error"); return; }
      setState("form");
    };
    void checkSession();
  }, [supabase]);

  // ── Indicateur de force du mot de passe
  function getStrength(pwd: string) {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    return score;
  }

  const strength    = getStrength(newPwd);
  const strengthLabel = ["", "Faible", "Moyen", "Bon", "Fort"][strength] ?? "";
  const strengthColor = ["", "var(--danger)", "var(--warning)", "var(--cyber-400)", "var(--success)"][strength] ?? "";
  const pwdMatch    = newPwd === confirmPwd && confirmPwd.length > 0;
  const canSubmit   = strength === 4 && pwdMatch;

  // ── Soumettre (remplace submit de #password-reset-form)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setState("success");
      // Déconnexion + redirection vers /auth (= connexion.html)
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/auth");
      }, 3000);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: "var(--gradient-navy)", backgroundAttachment: "fixed" }}>

      <div className="w-full max-w-md anim-fade-in-scale">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Globe size={28} style={{ color: "var(--cyber-500)" }} />
            <span className="font-black text-2xl" style={{ color: "white" }}>World Connect</span>
          </div>
          <div className="wc-chrome-line mt-2 mx-auto" style={{ maxWidth: "80px" }} />
        </div>

        <div className="rounded-3xl p-7" style={{ background: "var(--navy-700)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

          {/* Loading */}
          {state === "loading" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--cyber-500)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Vérification en cours…</p>
            </div>
          )}

          {/* Erreur lien invalide */}
          {state === "error" && (
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <AlertCircle size={56} style={{ color: "var(--danger)" }} />
              <h2 className="font-black text-xl" style={{ color: "white" }}>Lien invalide ou expiré</h2>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Ce lien n'est plus valide. Il a peut-être expiré ou a déjà été utilisé.
              </p>
              <button onClick={() => router.push("/auth")} className="wc-btn mt-2">
                Retour à la connexion
              </button>
            </div>
          )}

          {/* Succès */}
          {state === "success" && (
            <div className="flex flex-col items-center text-center py-4 gap-4 anim-fade-in">
              <CheckCircle size={56} style={{ color: "var(--success)" }} />
              <h2 className="font-black text-xl" style={{ color: "white" }}>Mot de passe modifié !</h2>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Redirection vers la connexion dans 3 secondes…
              </p>
            </div>
          )}

          {/* Formulaire */}
          {state === "form" && (
            <div className="anim-fade-in">
              <h2 className="font-black text-2xl mb-1" style={{ color: "white" }}>🔐 Nouveau mot de passe</h2>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-subtle)" }}>Créez un mot de passe sécurisé</p>

              {error && (
                <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4"
                  style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <form onSubmit={void handleSubmit} className="flex flex-col gap-4">
                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-subtle)" }} />
                    <input type={showNew ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "var(--navy-800)", border: "1.5px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyber-500)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-subtle)" }}>
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Barre de force */}
                  {newPwd.length > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${strength * 25}%`, background: strengthColor }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        {["6+ chars", "Majuscule", "Minuscule", "Chiffre"].map((req, i) => {
                          const valid = [newPwd.length >= 6, /[A-Z]/.test(newPwd), /[a-z]/.test(newPwd), /[0-9]/.test(newPwd)][i];
                          return <span key={req} style={{ color: valid ? "var(--success)" : "var(--foreground-subtle)" }}>{valid ? "✓" : "○"} {req}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmer */}
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Confirmer</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-subtle)" }} />
                    <input type={showConfirm ? "text" : "password"} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "var(--navy-800)", border: `1.5px solid ${confirmPwd.length > 0 ? (pwdMatch ? "var(--success)" : "var(--danger)") : "var(--border)"}`, color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-subtle)" }}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirmPwd.length > 0 && (
                    <p className="text-xs mt-1" style={{ color: pwdMatch ? "var(--success)" : "var(--danger)" }}>
                      {pwdMatch ? "✓ Les mots de passe correspondent" : "✗ Ne correspondent pas"}
                    </p>
                  )}
                </div>

                <button type="submit" disabled={!canSubmit || submitting} className="wc-btn justify-center mt-1"
                  style={{ padding: "0.875rem", opacity: !canSubmit || submitting ? 0.5 : 1 }}>
                  {submitting ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
                </button>
              </form>

              <button onClick={() => router.push("/auth")} className="flex items-center gap-1 mx-auto mt-4 text-xs font-semibold" style={{ color: "var(--cyber-400)" }}>
                <ArrowLeft size={13} /> Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
              }
                    
