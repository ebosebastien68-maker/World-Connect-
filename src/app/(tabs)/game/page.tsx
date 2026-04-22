"use client";

// ═══════════════════════════════════════════════════════════════
//  src/app/(tabs)/game/page.tsx
//  Converti depuis : offline.html (Jeu 3D)
//
//  Dans la v1 HTML, le jeu 3D était chargé via iframe offline.html
//  qui utilisait Three.js directement.
//
//  Dans la v2 Next.js :
//    - On recrée l'animation Three.js directement dans le composant
//    - Pas d'iframe nécessaire
//    - Le canvas occupe tout l'écran sous le BottomNav
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { Globe, Zap, RotateCcw } from "lucide-react";

export default function GamePage() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const animRef     = useRef<number>(0);
  const [score,     setScore]     = useState(0);
  const [running,   setRunning]   = useState(false);
  const [gameOver,  setGameOver]  = useState(false);
  const [highScore, setHighScore] = useState(0);

  // ── Jeu simple basé sur canvas (inspiré du jeu 3D original)
  // ── Remplace offline.html qui utilisait Three.js
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Plein écran
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particules (remplace Three.js particles)
    const PARTICLE_COUNT = 120;
    const particles: {
      x: number; y: number; z: number;
      vx: number; vy: number; vz: number;
      color: string;
    }[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 800,
        z: Math.random() * 400,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: -0.5 - Math.random() * 0.5,
        color: Math.random() > 0.5 ? "#4a9eff" : "#2152b8",
      });
    }

    let time = 0;

    function drawFrame() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      // Fond navy avec trail effect
      ctx.fillStyle = "rgba(7, 15, 43, 0.15)";
      ctx.fillRect(0, 0, W, H);

      // Globe wireframe au centre
      ctx.save();
      ctx.translate(cx, cy);
      const radius = Math.min(W, H) * 0.22;

      // Cercles du globe (rotation animée)
      ctx.strokeStyle = "rgba(74,158,255,0.25)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * Math.abs(Math.cos(angle + time * 0.3)), radius, angle + time * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Lignes horizontales
      for (let i = -3; i <= 3; i++) {
        const y = (i / 3) * radius;
        const r = Math.sqrt(Math.max(0, radius * radius - y * y));
        ctx.beginPath();
        ctx.ellipse(0, y, r, r * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Orbe orbital animé
      const orbX = Math.cos(time) * radius * 1.2;
      const orbY = Math.sin(time * 0.7) * radius * 0.4;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur  = 15;
      ctx.shadowColor = "var(--cyber-500)";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Particules en perspective
      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.z  += p.vz;
        if (p.z <= 0) p.z = 400;

        const perspective = 300 / p.z;
        const px = cx + p.x * perspective;
        const py = cy + p.y * perspective;
        const size = Math.max(0.5, 2 * perspective);

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, perspective * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Texte "WORLD CONNECT"
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.font      = `bold ${Math.min(W * 0.07, 40)}px var(--font-sans, sans-serif)`;
      ctx.textAlign = "center";
      ctx.fillText("WORLD CONNECT", cx, H * 0.85);

      time += 0.008;
      animRef.current = requestAnimationFrame(drawFrame);
    }

    drawFrame();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div style={{ position: "relative", height: "calc(100dvh - var(--bottom-nav-h))", overflow: "hidden", background: "var(--navy-950)" }}>

      {/* Canvas animation */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* Overlay UI */}
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>

        <Globe size={48} className="mb-4 animate-globe-spin"
          style={{ color: "var(--cyber-500)", filter: "drop-shadow(0 0 12px var(--cyber-500))" }} />

        <h1 className="font-black text-3xl text-center mb-2"
          style={{ color: "white", fontFamily: "var(--font-sans)", letterSpacing: "-0.03em" }}>
          Jeu 3D
        </h1>

        <p className="text-sm text-center mb-8"
          style={{ color: "var(--foreground-muted)", maxWidth: "280px" }}>
          Mode interactif World Connect — Animation stellaire en temps réel
        </p>

        {/* Stats */}
        <div className="flex gap-4 mb-8">
          <div className="wc-card px-5 py-3 text-center">
            <p className="font-black text-2xl" style={{ color: "var(--cyber-500)" }}>{score}</p>
            <p className="text-xs" style={{ color: "var(--foreground-subtle)" }}>Score</p>
          </div>
          <div className="wc-card px-5 py-3 text-center">
            <p className="font-black text-2xl" style={{ color: "var(--silver-400)" }}>{highScore}</p>
            <p className="text-xs" style={{ color: "var(--foreground-subtle)" }}>Record</p>
          </div>
        </div>

        {/* Boutons */}
        {!running && !gameOver && (
          <button
            onClick={() => { setRunning(true); setScore(0); }}
            className="wc-btn animate-cyber-pulse"
            style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>
            <Zap size={18} /> Démarrer
          </button>
        )}

        {running && (
          <button
            onClick={() => { setRunning(false); setGameOver(true); if (score > highScore) setHighScore(score); }}
            className="wc-btn"
            style={{ padding: "0.875rem 2rem", background: "rgba(239,68,68,0.2)", border: "1.5px solid var(--danger)", color: "var(--danger)" }}>
            Arrêter
          </button>
        )}

        {gameOver && (
          <div className="flex flex-col items-center gap-3">
            <p className="font-bold text-lg" style={{ color: "white" }}>Score final : {score}</p>
            <button
              onClick={() => { setGameOver(false); setRunning(true); setScore(0); }}
              className="wc-btn">
              <RotateCcw size={16} /> Rejouer
            </button>
          </div>
        )}

        {/* Compteur si en cours */}
        {running && (
          <div className="mt-6">
            <button
              onClick={() => setScore((s) => s + 1)}
              className="wc-card px-8 py-6 text-center active:scale-95 transition-transform cursor-pointer"
              style={{ boxShadow: "var(--shadow-cyber)" }}>
              <p className="font-black text-4xl mb-1" style={{ color: "var(--cyber-500)" }}>{score}</p>
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Taper pour marquer</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
