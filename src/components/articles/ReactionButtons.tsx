"use client";

// ═══════════════════════════════════════════════════════════════
//  src/components/articles/ReactionButtons.tsx
//  Extrait depuis : index.html → handleReaction()
//
//  Reçoit :
//    - articleId       : l'ID de l'article
//    - counts          : { like, love, rire, colere }
//    - userReactions   : les réactions déjà posées par l'user
//    - currentUser     : null si non connecté
//    - onReacted       : callback pour recharger l'article
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, Heart, Laugh, Angry } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toggleArticleReaction } from "@/lib/supabase/mutations";
import { cn } from "@/lib/utils";
import type { ReactionType } from "@/types/supabase";

// ─── Types ────────────────────────────────────────────────────
interface ReactionCounts {
  like:   number;
  love:   number;
  rire:   number;
  colere: number;
}

interface ReactionButtonsProps {
  articleId:     string;
  counts:        ReactionCounts;
  userReactions: ReactionType[];          // réactions posées par l'user sur CET article
  currentUserId: string | null;
  onReacted:     () => void;              // callback → recharge le feed
}

// ─── Config des 4 boutons (même ordre que index.html) ─────────
const REACTIONS: {
  type:  ReactionType;
  icon:  React.ReactNode;
  color: string;
}[] = [
  { type: "like",   icon: <ThumbsUp size={22} />, color: "#4a9eff" },
  { type: "love",   icon: <Heart    size={22} />, color: "#ef4444" },
  { type: "rire",   icon: <Laugh   size={22} />, color: "#f59e0b" },
  { type: "colere", icon: <Angry   size={22} />, color: "#f97316" },
];

// ─── Composant ────────────────────────────────────────────────
export function ReactionButtons({
  articleId,
  counts,
  userReactions,
  currentUserId,
  onReacted,
}: ReactionButtonsProps) {
  const router   = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [pending, setPending] = useState<ReactionType | null>(null);

  // ── handleReaction() depuis index.html ──────────────────────
  async function handleReaction(reactionType: ReactionType) {
    // Pas connecté → redirect /auth (remplace window.location.href='connexion.html')
    if (!currentUserId) {
      router.push("/auth");
      return;
    }

    if (pending) return; // évite le double-clic
    setPending(reactionType);

    await toggleArticleReaction(supabase, articleId, currentUserId, reactionType);

    onReacted();    // demande au feed de recharger
    setPending(null);
  }

  return (
    <div
      className="flex"
      style={{
        borderTop:    "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background:   "var(--background-card)",
      }}
    >
      {REACTIONS.map(({ type, icon, color }) => {
        const isActive = userReactions.includes(type);
        const count    = counts[type] ?? 0;

        return (
          <button
            key={type}
            onClick={() => void handleReaction(type)}
            disabled={pending === type}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.5",
              "py-3 transition-all duration-200 relative overflow-hidden",
              isActive ? "scale-105" : "hover:bg-white/5"
            )}
            style={
              isActive
                ? {
                    background:  `${color}22`,
                    color,
                    boxShadow:   `inset 0 0 0 1.5px ${color}44`,
                  }
                : { color: "var(--foreground-subtle)" }
            }
            aria-label={`Réaction ${type}`}
            aria-pressed={isActive}
          >
            {/* Indicateur actif en haut */}
            {isActive && (
              <span
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full"
                style={{ background: color, boxShadow: `0 0 6px ${color}` }}
              />
            )}

            {/* Icône */}
            <span
              style={{
                filter: isActive ? `drop-shadow(0 0 5px ${color})` : "none",
                transition: "all 200ms ease",
                transform: isActive ? "scale(1.15)" : "scale(1)",
              }}
            >
              {icon}
            </span>

            {/* Compteur */}
            <span
              className="text-xs font-bold min-w-[20px] text-center px-1.5 py-0.5 rounded-full"
              style={{
                background: isActive ? `${color}33` : "var(--globe-ghost)",
                color:       isActive ? color : "var(--foreground)",
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
