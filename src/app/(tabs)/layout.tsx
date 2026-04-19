import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";

/*
  Layout des onglets — wraps toutes les pages :
  /, /messages, /notifications, /plus, /game

  Structure plein écran :
  ┌─────────────────────────────┐  ← 100dvh
  │                             │
  │   <children>  (scroll)      │  ← flex-1, overflow-y-auto
  │                             │
  ├─────────────────────────────┤
  │   <BottomNav>  72px fixe    │  ← position: fixed bottom-0
  └─────────────────────────────┘
*/

export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    /*
      Fond navy plein écran — couvre tout y compris derrière le BottomNav
      et sous le notch iOS via safe-area
    */
    <div
      style={{
        minHeight:       "100dvh",
        width:           "100%",
        background:      "var(--gradient-navy)",
        backgroundAttachment: "fixed",
        display:         "flex",
        flexDirection:   "column",
        position:        "relative",
      }}
    >
      {/* Zone scrollable — pousse le contenu au-dessus du BottomNav */}
      <main
        id="main-content"
        style={{
          flex:         1,
          overflowY:    "auto",
          overflowX:    "hidden",
          /* Espace sous le contenu = hauteur BottomNav */
          paddingBottom: "var(--bottom-nav-h)",
          /* Safe area top iOS (notch) */
          paddingTop:    "env(safe-area-inset-top, 0px)",
          /* Scroll fluide iOS */
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </main>

      {/* BottomNav — reçoit les badges en temps réel via Server/Client */}
      <BottomNav
        messageBadge={0}       /* TODO: brancher sur le store Zustand / React Query */
        notificationBadge={0}
      />
    </div>
  );
}
