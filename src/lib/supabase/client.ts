// ═══════════════════════════════════════════════════════════════════
//  supabase/client.ts  — Client NAVIGATEUR (Client Components)
//  Équivalent TypeScript de supabaseClient.js
//
//  Variables d'environnement Vercel (jamais écrites dans le code) :
//    NEXT_PUBLIC_SUPABASE_URL
//    NEXT_PUBLIC_SUPABASE_ANON_KEY
//
//  "use client" n'est PAS mis ici — ce fichier est importé
//  uniquement depuis des composants déjà marqués "use client"
// ═══════════════════════════════════════════════════════════════════

import { createBrowserClient } from "@supabase/ssr";

// Vérification au démarrage — plante tôt si les variables manquent
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "❌ Variables Supabase manquantes.\n" +
    "Ajoute dans Vercel (ou .env.local) :\n" +
    "  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co\n" +
    "  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..."
  );
}

/**
 * createSupabaseBrowserClient()
 *
 * Crée un client Supabase côté navigateur.
 * À appeler dans les Client Components ("use client").
 *
 * ⚠️  Ne pas instancier en dehors des composants/hooks —
 *     utiliser le hook useSupabase() de préférence.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl!, supabaseKey!);
}
