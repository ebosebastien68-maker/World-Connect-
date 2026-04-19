// ═══════════════════════════════════════════════════════════════════
//  supabase/server.ts  — Client SERVEUR (Server Components, API Routes)
//
//  Variables d'environnement Vercel :
//    NEXT_PUBLIC_SUPABASE_URL      (lisible côté client aussi)
//    NEXT_PUBLIC_SUPABASE_ANON_KEY (lisible côté client aussi)
//
//  Si tu ajoutes la service_role key pour des actions admin :
//    SUPABASE_SERVICE_ROLE_KEY     (JAMAIS préfixée NEXT_PUBLIC_)
// ═══════════════════════════════════════════════════════════════════

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * createSupabaseServerClient()
 *
 * Client Supabase pour Server Components et Route Handlers.
 * Gère automatiquement les cookies de session.
 *
 * Usage dans un Server Component :
 *   const supabase = await createSupabaseServerClient();
 *   const { data } = await supabase.from("articles").select("*");
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignoré si appelé depuis un Server Component read-only
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Ignoré si appelé depuis un Server Component read-only
          }
        },
      },
    }
  );
}
