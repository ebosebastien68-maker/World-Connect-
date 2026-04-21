// ═══════════════════════════════════════════════════════════════
//  src/app/(tabs)/page.tsx
//  Page d'accueil "/" — branche ArticleFeed
//
//  Avant : page avec squelettes statiques
//  Maintenant : branché sur ArticleFeed (données réelles Supabase)
// ═══════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { ArticleFeed } from "@/components/articles/ArticleFeed";

export const metadata: Metadata = {
  title:       "Accueil",
  description: "Fil d'actualité World Connect",
};

export default function HomePage() {
  return <ArticleFeed />;
}


      {/* ── Header fixe en haut ───────────────────────────────── */}
      <header
        style={{
          position:       "sticky",
          top:            0,
          left:           0,
          right:          0,
          zIndex:         40,
          padding:        "0 1rem",
          height:         "60px",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          background:     "rgba(13,31,78,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom:   "1px solid var(--border)",
          boxShadow:      "0 2px 24px rgba(7,15,43,0.6)",
        }}
      >
        {/* Logo + nom */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Globe SVG inline — reproduit l'icône du logo */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden
            style={{ filter: "drop-shadow(0 0 6px rgba(74,158,255,0.5))" }}
          >
            <circle cx="16" cy="16" r="11" stroke="white" strokeWidth="1.6" />
            <ellipse cx="16" cy="16" rx="5.5" ry="11" stroke="white" strokeWidth="1.4" />
            <line x1="5" y1="16" x2="27" y2="16" stroke="white" strokeWidth="1.4" />
            <line x1="7"  y1="11" x2="25" y2="11" stroke="white" strokeWidth="1.2" />
            <line x1="7"  y1="21" x2="25" y2="21" stroke="white" strokeWidth="1.2" />
            {/* Orbital arc */}
            <path
              d="M 6 22 Q 16 8 26 14"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="6"  cy="22" r="2" fill="white" />
            <circle cx="26" cy="14" r="2" fill="white" />
            {/* Connection nodes */}
            <circle cx="10" cy="16" r="1.2" fill="none" stroke="white" strokeWidth="1" />
            <line x1="5" y1="16" x2="8.8" y2="16" stroke="white" strokeWidth="1" />
            <circle cx="22" cy="16" r="1.2" fill="none" stroke="white" strokeWidth="1" />
            <line x1="23.2" y1="16" x2="27" y2="16" stroke="white" strokeWidth="1" />
          </svg>

          <span
            style={{
              fontFamily:  "var(--font-sans)",
              fontWeight:  800,
              fontSize:    "1.2rem",
              color:       "white",
              letterSpacing: "-0.02em",
            }}
          >
            World Connect
          </span>
        </div>

        {/* Ligne chrome décorative sous le nom */}
        <div
          aria-hidden
          style={{
            position:   "absolute",
            bottom:     0,
            left:       0,
            right:      0,
            height:     "1px",
            background: "var(--gradient-border)",
          }}
        />
      </header>

      {/* ── Contenu principal ─────────────────────────────────── */}
      <section
        style={{
          maxWidth: "680px",
          margin:   "0 auto",
          padding:  "1.25rem 1rem",
          width:    "100%",
        }}
      >

        {/* Slogan / Hero mini */}
        <div
          className="wc-card anim-slide-up"
          style={{ padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}
        >
          <p
            style={{
              fontFamily:  "var(--font-sans)",
              fontSize:    "0.75rem",
              fontWeight:  600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color:       "var(--cyber-500)",
              marginBottom: "0.5rem",
            }}
          >
            Votre empire numérique
          </p>
          <h1
            style={{
              fontSize:    "clamp(1.4rem, 5vw, 2rem)",
              fontWeight:  900,
              color:       "white",
              marginBottom: "0.5rem",
            }}
          >
            Bienvenue sur<br />World Connect
          </h1>
          <div className="wc-chrome-line" style={{ margin: "0.75rem auto", maxWidth: "120px" }} />
          <p style={{ fontSize: "0.9rem", color: "var(--foreground-muted)" }}>
            Partagez, connectez et développez votre réseau mondial.
          </p>
        </div>

        {/* Feed articles — placeholder */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2, 3].map((i) => (
            <article
              key={i}
              className={`wc-card anim-slide-up anim-delay-${i}`}
              style={{ padding: "1.25rem" }}
            >
              {/* Skeleton header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                {/* Avatar */}
                <div
                  style={{
                    width:        "44px",
                    height:       "44px",
                    borderRadius: "50%",
                    background:   "var(--gradient-btn)",
                    flexShrink:   0,
                    border:       "2px solid var(--border)",
                    boxShadow:    "0 0 8px rgba(74,158,255,0.3)",
                  }}
                />
                <div>
                  <div
                    style={{
                      width:        "120px",
                      height:       "12px",
                      background:   "var(--globe-ghost)",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "6px",
                    }}
                  />
                  <div
                    style={{
                      width:        "80px",
                      height:       "10px",
                      background:   "var(--globe-ghost)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  />
                </div>
              </div>

              {/* Skeleton texte */}
              {[100, 90, 70].map((w, j) => (
                <div
                  key={j}
                  style={{
                    width:        `${w}%`,
                    height:       "11px",
                    background:   "var(--globe-ghost)",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: "8px",
                  }}
                />
              ))}

              {/* Ligne chrome séparateur */}
              <div className="wc-chrome-line" style={{ margin: "1rem 0 0.75rem" }} />

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["👍", "❤️", "😂", "😡"].map((emoji) => (
                  <button
                    key={emoji}
                    className="wc-btn"
                    style={{
                      flex:       1,
                      padding:    "0.5rem",
                      fontSize:   "0.75rem",
                      background: "var(--globe-ghost)",
                      border:     "1px solid var(--border-light)",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>

      </section>
    </div>
  );
}
