"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  Bell,
  PlusCircle,
  Gamepad2,
} from "lucide-react";
import { cn, formatBadge } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────────── */
interface NavItem {
  href:    string;
  label:   string;
  icon:    React.ElementType;
  badgeKey?: "messages" | "notifications";
}

interface BottomNavProps {
  messageBadge?:      number;
  notificationBadge?: number;
}

/* ─── Config des onglets ─────────────────────────────────────────── */
const NAV_ITEMS: NavItem[] = [
  { href: "/",             label: "Accueil",       icon: Home         },
  { href: "/messages",     label: "Messages",      icon: MessageCircle, badgeKey: "messages"      },
  { href: "/notifications",label: "Notifs",        icon: Bell,          badgeKey: "notifications" },
  { href: "/plus",         label: "World Connect", icon: PlusCircle   },
  { href: "/game",         label: "Jeu 3D",        icon: Gamepad2     },
];

/* ─── Composant ──────────────────────────────────────────────────── */
export function BottomNav({
  messageBadge      = 0,
  notificationBadge = 0,
}: BottomNavProps) {
  const pathname = usePathname();

  const getBadge = (key?: NavItem["badgeKey"]): number => {
    if (key === "messages")      return messageBadge;
    if (key === "notifications") return notificationBadge;
    return 0;
  };

  return (
    <>
      {/* ── Ligne chrome au-dessus ────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:   "fixed",
          bottom:     "var(--bottom-nav-h)",
          left:       0,
          right:      0,
          height:     "1.5px",
          background: "var(--gradient-border)",
          zIndex:     49,
          pointerEvents: "none",
        }}
      />

      {/* ── Barre de navigation ───────────────────────────────── */}
      <nav
        aria-label="Navigation principale"
        style={{
          position:        "fixed",
          bottom:          0,
          left:            0,
          right:           0,
          height:          "var(--bottom-nav-h)",
          zIndex:          50,
          display:         "flex",
          alignItems:      "stretch",
          background:      "rgba(13,31,78,0.85)",
          backdropFilter:  "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop:       "1px solid rgba(196,200,216,0.12)",
          boxShadow:       "0 -4px 32px rgba(7,15,43,0.7)",
          /* Safe area iOS */
          paddingBottom:   "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon    = item.icon;
          const badge   = getBadge(item.badgeKey);
          const badgeTxt = formatBadge(badge);

          // Actif si pathname exact ou commence par le segment
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1",
                "transition-all duration-200",
                "outline-none focus-visible:bg-white/5",
                isActive ? "text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {/* Indicateur actif — lueur cyber en haut */}
              {isActive && (
                <span
                  aria-hidden
                  style={{
                    position:    "absolute",
                    top:         0,
                    left:        "50%",
                    transform:   "translateX(-50%)",
                    width:       "48px",
                    height:      "2px",
                    background:  "var(--cyber-500)",
                    borderRadius: "0 0 4px 4px",
                    boxShadow:   "0 0 10px var(--cyber-500), 0 0 20px rgba(74,158,255,0.4)",
                  }}
                />
              )}

              {/* Icône + badge */}
              <span className="relative">
                <Icon
                  size={isActive ? 26 : 24}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{
                    transition:  "all 200ms ease",
                    filter:       isActive
                      ? "drop-shadow(0 0 6px rgba(74,158,255,0.7))"
                      : "none",
                  }}
                />

                {/* Badge nombre */}
                {badgeTxt && (
                  <span
                    aria-label={`${badge} non lu`}
                    className="wc-badge"
                    style={{
                      position:  "absolute",
                      top:       "-6px",
                      right:     "-8px",
                      fontSize:  "0.6rem",
                    }}
                  >
                    {badgeTxt}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                style={{
                  fontSize:    isActive ? "0.65rem" : "0.6rem",
                  fontWeight:  isActive ? 700 : 500,
                  letterSpacing: "0.02em",
                  transition:  "all 200ms ease",
                  lineHeight:  1,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
                  }
