"use client";

// ═══════════════════════════════════════════════════════════════
//  src/app/(tabs)/plus/page.tsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Globe, ArrowRight, MessageCircle, Smartphone, Monitor,
  Settings, Cpu, Bot, Shield, Cloud,
  ChevronRight,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/supabase";

const SERVICES = [
  { icon: <Globe        size={36} />, title: "Sites Web & Design",       desc: "Sites professionnels ultra-modernes, e-commerce performants, landing pages qui convertissent." },
  { icon: <Smartphone   size={36} />, title: "Applications Mobile",       desc: "Applications iOS et Android natives, APK personnalisés, interface fluide et performances optimales." },
  { icon: <Monitor      size={36} />, title: "Applications Web",          desc: "Plateformes web complètes, SaaS, dashboards interactifs, outils métiers sur mesure." },
  { icon: <Settings     size={36} />, title: "Logiciels Sur Mesure",      desc: "Développement de logiciels desktop, solutions d'entreprise, outils spécifiques." },
  { icon: <Cpu          size={36} />, title: "Programmation Machines",    desc: "Automatisation industrielle, IoT, systèmes embarqués, contrôle de machines intelligentes." },
  { icon: <Bot          size={36} />, title: "Intelligence Artificielle", desc: "Chatbots intelligents, automatisation IA avancée, machine learning, analyse prédictive." },
  { icon: <Shield       size={36} />, title: "Backend & Sécurité",        desc: "Architecture robuste, API performantes, bases de données optimisées, authentification multi-niveaux." },
  { icon: <Cloud        size={36} />, title: "Cloud & DevOps",            desc: "Déploiement cloud automatisé, CI/CD, infrastructure scalable, monitoring 24/7." },
];

const SOLUTIONS = [
  { icon: "🔔", title: "Notifications Push Directes",   desc: "Communiquez directement avec vos clients. Sans algorithme. Sans payer pour être vu." },
  { icon: "💾", title: "Base Clients Permanente",       desc: "Votre base de données clients vous appartient à 100% et pour toujours." },
  { icon: "💳", title: "Paiements Automatiques",        desc: "Système de paiement intégré. Même quand vous dormez." },
  { icon: "⚙️", title: "Automatisation Totale",         desc: "Réponses automatiques, prise de rendez-vous, suivis clients. 24h/24, 7j/7." },
  { icon: "📊", title: "Analytics Avancés",             desc: "Dashboard complet : chiffre d'affaires, taux de conversion, rétention client." },
  { icon: "🏆", title: "Image Professionnelle",         desc: "La crédibilité d'une vraie entreprise. Exactement ce que font les grandes sociétés." },
];

const STATS = [
  { value: 200, label: "Projets Réalisés" },
  { value: 99,  label: "% Satisfaction" },
  { value: 24,  label: "Support / 7 Jours" },
  { value: 60,  label: "Technologies" },
];

const PROBLEMS = [
  { n: "01", title: "Les réseaux sociaux ne vous appartiennent pas", desc: "Aujourd'hui visible. Demain bloqué. Un signalement, un changement d'algorithme… Votre visibilité disparaît." },
  { n: "02", title: "Les impressions inutiles vous coûtent",         desc: "Des milliers de vues, des likes… Mais très peu de vraies conversions. Vous payez pour être vu, pas pour vendre." },
  { n: "03", title: "Vous perdez du temps sur des tâches répétitives", desc: "Les mêmes questions chaque jour. Ce temps précieux devrait être automatisé, pas consommé." },
  { n: "04", title: "Vos données sont éparpillées",                  desc: "WhatsApp, Instagram, Facebook… Impossible d'avoir une vision d'ensemble claire." },
  { n: "05", title: "Votre entreprise s'arrête quand vous vous déconnectez", desc: "Pas connecté → pas de réponses → pas de ventes. Ce n'est pas une vraie entreprise." },
];

function Counter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = target / 80;
      const id = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(id); }
        else setCount(Math.floor(start));
      }, 20);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{count}</span>;
}

export default function PlusPage() {
  const router   = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("users_profile").select("user_id,prenom,nom,role")
        .eq("user_id", session.user.id).single();
      if (data) setUserProfile(data as UserProfile);
    })();
  }, [supabase]);

  return (
    <div className="wc-page" style={{ paddingBottom: "calc(var(--bottom-nav-h) + 2rem)" }}>

      {userProfile?.role === "admin" && (
        <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-2"
          style={{ background: "rgba(33,82,184,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
          <span className="text-xs font-bold" style={{ color: "var(--cyber-300)" }}>Mode Administration</span>
          <div className="flex gap-2">
            <button onClick={() => router.push("/plus/publier")}
              className="wc-btn" style={{ padding: "0.35rem 0.875rem", fontSize: "0.75rem" }}>
              ✏️ Publier
            </button>
            <button onClick={() => router.push("/plus/admin")}
              className="wc-btn" style={{ padding: "0.35rem 0.875rem", fontSize: "0.75rem", background: "var(--gradient-chrome)", color: "var(--navy-900)" }}>
              ⚙️ Dashboard
            </button>
          </div>
        </div>
      )}

      <section className="relative flex flex-col items-center justify-center text-center px-5 pt-16 pb-14">
        <div aria-hidden className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(74,158,255,0.15), transparent 70%)", filter: "blur(40px)" }} />
        <div aria-hidden className="absolute bottom-0 right-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(33,82,184,0.2), transparent 70%)", filter: "blur(40px)" }} />

        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 animate-cyber-pulse"
          style={{ background: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.3)", color: "var(--cyber-500)", letterSpacing: "0.1em" }}>
          🚀 Solutions Digitales Innovantes 2026
        </span>

        <h1 className="font-black mb-4 leading-none"
          style={{
            fontSize: "clamp(2.5rem, 10vw, 5rem)",
            background: "linear-gradient(135deg, var(--globe-white) 0%, var(--cyber-500) 60%, var(--cyber-300) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            backgroundClip: "text",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.03em",
          }}>
          WORLD CONNECT
        </h1>

        <p className="text-base font-semibold mb-3" style={{ color: "var(--silver-400)" }}>
          Sites Web • Applications Mobile • Logiciels • APK • IA
        </p>
        <p className="text-sm leading-relaxed max-w-lg mb-8" style={{ color: "var(--foreground-muted)" }}>
          Nous créons des solutions digitales complètes qui vous appartiennent à 100%.
          Construisez votre empire numérique avec World Connect.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => router.push("/")} className="wc-btn justify-center" style={{ padding: "0.875rem" }}>
            Accéder à Notre Plateforme <ArrowRight size={16} />
          </button>
          <button onClick={() => router.push("/messages")} className="wc-btn justify-center"
            style={{ padding: "0.875rem", background: "transparent", border: "1.5px solid var(--cyber-500)", color: "var(--cyber-500)" }}>
            <MessageCircle size={16} /> Nous Contacter
          </button>
        </div>
      </section>

      <div className="wc-chrome-line mx-5 mb-10" />

      <section className="px-5 mb-12">
        <div className="grid grid-cols-2 gap-3">
          {STATS.map(({ value, label }) => (
            <div key={label} className="wc-card p-5 text-center anim-fade-in">
              <div className="font-black mb-1"
                style={{
                  fontSize: "2.5rem",
                  background: "linear-gradient(135deg, var(--cyber-500), var(--cyber-300))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontFamily: "var(--font-sans)",
                }}>
                <Counter target={value} />+
              </div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)", letterSpacing: "0.1em" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 mb-12">
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block"
            style={{ background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.2)", color: "var(--cyber-500)" }}>
            Ce Que Nous Faisons
          </span>
          <h2 className="font-black text-2xl" style={{ color: "white", fontFamily: "var(--font-sans)" }}>Services Complets</h2>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>De la conception au déploiement</p>
        </div>
        <div className="flex flex-col gap-3">
          {SERVICES.map(({ icon, title, desc }) => (
            <div key={title} className="wc-card flex items-start gap-4 p-4 anim-fade-in group">
              <div className="flex-shrink-0 p-2 rounded-xl transition-all group-hover:scale-110"
                style={{ background: "rgba(74,158,255,0.1)", color: "var(--cyber-500)", filter: "drop-shadow(0 0 6px rgba(74,158,255,0.3))" }}>
                {icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm mb-1" style={{ color: "white", fontFamily: "var(--font-sans)" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{desc}</p>
              </div>
              <ChevronRight size={16} className="flex-shrink-0 mt-1" style={{ color: "var(--foreground-subtle)" }} />
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 mb-12">
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}>
            La Réalité
          </span>
          <h2 className="font-black text-2xl" style={{ color: "white", fontFamily: "var(--font-sans)" }}>
            Les Vraies Raisons de Votre Échec
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {PROBLEMS.map(({ n, title, desc }) => (
            <div key={n} className="rounded-2xl p-5 anim-fade-in transition-all hover:translate-x-1"
              style={{
                background: "rgba(13,31,78,0.5)",
                border: "1px solid var(--border)",
                borderLeftWidth: "4px",
                borderLeftColor: "var(--cyber-500)",
              }}>
              <div className="font-black text-3xl mb-2"
                style={{
                  background: "linear-gradient(135deg, var(--cyber-500), var(--navy-400))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontFamily: "var(--font-sans)",
                }}>
                {n}
              </div>
              <h3 className="font-bold text-sm mb-2" style={{ color: "white" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 mb-12">
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "var(--success)" }}>
            La Solution
          </span>
          <h2 className="font-black text-2xl" style={{ color: "white", fontFamily: "var(--font-sans)" }}>
            Une Plateforme Qui Vous Appartient
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SOLUTIONS.map(({ icon, title, desc }) => (
            <div key={title} className="wc-card p-4 text-center anim-fade-in">
              <div className="text-3xl mb-2">{icon}</div>
              <h4 className="font-bold text-xs mb-1" style={{ color: "var(--cyber-400)", fontFamily: "var(--font-sans)" }}>{title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-subtle)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5">
        <div className="rounded-3xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(74,158,255,0.12), rgba(33,82,184,0.12))",
            border:     "2px solid rgba(74,158,255,0.25)",
            boxShadow:  "var(--shadow-cyber)",
          }}>
          <h2 className="font-black text-2xl mb-3" style={{ color: "white", fontFamily: "var(--font-sans)" }}>
            Prêt à Transformer Votre Vision ?
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>100% personnalisé, 100% à vous.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/")} className="wc-btn justify-center" style={{ padding: "0.875rem" }}>
              Accéder à la Plateforme <ArrowRight size={16} />
            </button>
            <button onClick={() => router.push("/messages")} className="wc-btn justify-center"
              style={{ padding: "0.875rem", background: "transparent", border: "1.5px solid var(--silver-400)", color: "var(--silver-400)" }}>
              Analyse Gratuite — Sans Engagement
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
