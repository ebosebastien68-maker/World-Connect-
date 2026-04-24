"use client";

// ═══════════════════════════════════════════════════════════════
//  src/app/(tabs)/plus/publier/page.tsx
//  Converti depuis : publier.html
//
//  ✅ FIX : useSearchParams() doit être dans un composant enfant
//     enveloppé par <Suspense>, sinon Next.js 15 bloque le build
//     lors du pré-rendu statique de la page.
// ═══════════════════════════════════════════════════════════════

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Globe, ArrowLeft, Image as ImageIcon, Video,
  Link2, ShoppingCart, Trash2, Send, Pencil,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface FormState {
  texte:        string;
  texte_url:    string;
  vente_url:    string;
  whatsapp_url: string;
}

// ─────────────────────────────────────────────────────────────────
//  Composant interne — utilise useSearchParams() librement
//  car il est garanti d'être sous <Suspense>
// ─────────────────────────────────────────────────────────────────
function PublierContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("edit");
  const supabase     = createSupabaseBrowserClient();

  const [userId,        setUserId]        = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [form,          setForm]          = useState<FormState>({ texte: "", texte_url: "", vente_url: "", whatsapp_url: "" });
  const [images,        setImages]        = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [video,         setVideo]         = useState<File | null>(null);
  const [videoPreview,  setVideoPreview]  = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ── Vérification admin ────────────────────────────────────
  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth"); return; }
      const { data } = await supabase
        .from("users_profile").select("role").eq("user_id", session.user.id).single();
      if (data?.role !== "admin") { router.replace("/"); return; }
      setUserId(session.user.id);

      // Mode édition : charger l'article existant
      if (editId) {
        const { data: art } = await supabase
          .from("articles").select("texte,texte_url,vente_url,whatsapp_url").eq("article_id", editId).single();
        if (art) setForm({
          texte: art.texte ?? "", texte_url: art.texte_url ?? "",
          vente_url: art.vente_url ?? "", whatsapp_url: art.whatsapp_url ?? "",
        });
      }
      setLoading(false);
    })();
  }, [supabase, router, editId]);

  // ── Sélection images ──────────────────────────────────────
  function handleImages(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 4);
    setImages((prev) => [...prev, ...arr].slice(0, 4));
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreviews((prev) => [...prev, e.target?.result as string].slice(0, 4));
      reader.readAsDataURL(f);
    });
  }

  function removeImage(i: number) {
    setImages((p) => p.filter((_, idx) => idx !== i));
    setImagePreviews((p) => p.filter((_, idx) => idx !== i));
  }

  // ── Sélection vidéo ───────────────────────────────────────
  function handleVideo(files: FileList | null) {
    if (!files?.[0]) return;
    const f = files[0];
    if (!f.type.startsWith("video/")) { toast.error("Format vidéo invalide"); return; }
    if (f.size > 100 * 1024 * 1024) { toast.error("Vidéo trop lourde (max 100 MB)"); return; }
    setVideo(f);
    setVideoPreview(URL.createObjectURL(f));
  }

  // ── Upload fichier vers Supabase Storage ──────────────────
  async function uploadFile(file: File, bucket: string, folder: string): Promise<string> {
    const ext  = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // ── Soumission (nouveau ou mise à jour) ───────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !form.texte.trim()) return;
    setSubmitting(true);

    try {
      let articleId = editId;

      if (editId) {
        const { error } = await supabase
          .from("articles")
          .update({ texte: form.texte, texte_url: form.texte_url || null, vente_url: form.vente_url || null, whatsapp_url: form.whatsapp_url || null })
          .eq("article_id", editId);
        if (error) throw error;
        toast.success("Article mis à jour !");
      } else {
        const { data, error } = await supabase
          .from("articles")
          .insert({ user_id: userId, texte: form.texte, texte_url: form.texte_url || null, vente_url: form.vente_url || null, whatsapp_url: form.whatsapp_url || null })
          .select("article_id").single();
        if (error) throw error;
        articleId = data.article_id as string;

        for (const img of images) {
          const url = await uploadFile(img, "articles-images", "images");
          await supabase.from("article_images").insert({ article_id: articleId, image_url: url });
        }

        if (video) {
          const url = await uploadFile(video, "articles-videos", "videos");
          await supabase.from("article_videos").insert({ article_id: articleId, video_url: url });
        }

        toast.success("Article publié avec succès !");
      }

      setTimeout(() => router.push("/"), 800);

    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la publication");
    }

    setSubmitting(false);
  }

  if (loading) return (
    <div className="wc-page flex items-center justify-center min-h-dvh">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--cyber-500)", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="wc-page">
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, height: "60px", padding: "0 1rem", display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(13,31,78,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ color: "var(--cyber-500)", background: "var(--globe-ghost)" }}>
          <ArrowLeft size={18} />
        </button>
        <Globe size={20} style={{ color: "var(--cyber-500)" }} />
        <h1 className="font-black text-lg" style={{ color: "white", letterSpacing: "-0.02em" }}>
          {editId ? "Modifier l'article" : "Publier un article"}
        </h1>
      </header>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">

          {/* Texte */}
          <div className="wc-card p-4">
            <label className="block text-xs font-bold mb-2" style={{ color: "var(--foreground-muted)" }}>
              Contenu de l'article *
            </label>
            <textarea
              value={form.texte}
              onChange={(e) => setForm((p) => ({ ...p, texte: e.target.value }))}
              placeholder="Écrivez votre article ici..."
              required rows={6}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{ background: "var(--navy-900)", border: "1.5px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-sans)", whiteSpace: "pre-wrap" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyber-500)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Liens */}
          <div className="wc-card p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>Liens optionnels</h3>
            {[
              { key: "texte_url" as const,    icon: <Link2 size={14} />,         label: "Lien externe",   ph: "https://..." },
              { key: "vente_url" as const,     icon: <ShoppingCart size={14} />, label: "Lien d'achat",  ph: "https://..." },
              { key: "whatsapp_url" as const,  icon: <Globe size={14} />,        label: "Lien WhatsApp", ph: "https://wa.me/..." },
            ].map(({ key, icon, label, ph }) => (
              <div key={key}>
                <label className="flex items-center gap-1 text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  {icon} {label}
                </label>
                <input type="url" value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={ph}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "var(--navy-900)", border: "1.5px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyber-500)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>
            ))}
          </div>

          {/* Images — masqué en mode édition */}
          {!editId && (
            <div className="wc-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-muted)" }}>Images (max 4)</h3>
              <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={(e) => handleImages(e.target.files)} />
              <button type="button" onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 w-full py-4 rounded-xl text-sm font-semibold justify-center transition-all hover:opacity-80"
                style={{ background: "var(--globe-ghost)", border: "1.5px dashed var(--border)", color: "var(--foreground-muted)" }}>
                <ImageIcon size={18} /> Ajouter des images
              </button>
              {imagePreviews.length > 0 && (
                <div className={`grid mt-3 gap-2 ${imagePreviews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "var(--danger)", color: "white" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vidéo — masqué en mode édition */}
          {!editId && (
            <div className="wc-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-muted)" }}>Vidéo (max 100 MB)</h3>
              <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }}
                onChange={(e) => handleVideo(e.target.files)} />
              {!videoPreview ? (
                <button type="button" onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2 w-full py-4 rounded-xl text-sm font-semibold justify-center transition-all hover:opacity-80"
                  style={{ background: "var(--globe-ghost)", border: "1.5px dashed var(--border)", color: "var(--foreground-muted)" }}>
                  <Video size={18} /> Ajouter une vidéo
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden">
                  <video src={videoPreview} controls className="w-full rounded-xl" style={{ maxHeight: "240px" }} />
                  <button type="button" onClick={() => { setVideo(null); setVideoPreview(""); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "var(--danger)", color: "white" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bouton soumettre */}
          <button type="submit" disabled={submitting || !form.texte.trim()} className="wc-btn justify-center"
            style={{ padding: "1rem", fontSize: "0.95rem", opacity: submitting || !form.texte.trim() ? 0.6 : 1 }}>
            {submitting ? (
              <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Envoi en cours…</>
            ) : editId ? (
              <><Pencil size={16} /> Mettre à jour</>
            ) : (
              <><Send size={16} /> Publier l&apos;article</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ✅ Export par défaut — enveloppe dans <Suspense>
//     obligatoire pour tout composant utilisant useSearchParams()
//     en Next.js 13+ avec l'App Router
// ─────────────────────────────────────────────────────────────────
export default function PublierPage() {
  return (
    <Suspense fallback={
      <div className="wc-page flex items-center justify-center min-h-dvh">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--cyber-500)", borderTopColor: "transparent" }} />
      </div>
    }>
      <PublierContent />
    </Suspense>
  );
}

