// ═══════════════════════════════════════════════════════════════════
//  World Connect — Types Supabase
//  Miroir exact des tables de la base de données
// ═══════════════════════════════════════════════════════════════════

export type UserRole = "admin" | "user";

// ─── Table : users_profile ────────────────────────────────────────
export interface UserProfile {
  user_id: string;
  prenom:  string;
  nom:     string;
  role:    UserRole;
}

// ─── Table : articles ─────────────────────────────────────────────
export interface Article {
  article_id:    string;
  user_id:       string;
  texte:         string;
  texte_url?:    string | null;
  vente_url?:    string | null;
  whatsapp_url?: string | null;
  date_created:  string;
  reaction_like:   number;
  reaction_love:   number;
  reaction_rire:   number;
  reaction_colere: number;
  comment_count?:  number;
  // Joins
  users_profile?:  UserProfile;
  article_images?: ArticleImage[];
  article_videos?: ArticleVideo[];
}

// ─── Table : article_images ───────────────────────────────────────
export interface ArticleImage {
  id:         string;
  article_id: string;
  image_url:  string;
}

// ─── Table : article_videos ───────────────────────────────────────
export interface ArticleVideo {
  id:         string;
  article_id: string;
  video_url:  string;
}

// ─── Table : article_reactions ────────────────────────────────────
export type ReactionType = "like" | "love" | "rire" | "colere";

export interface ArticleReaction {
  reaction_id:   string;
  article_id:    string;
  user_id:       string;
  reaction_type: ReactionType;
}

// ─── Table : notifications ────────────────────────────────────────
export interface Notification {
  notification_id: string;
  user_id:         string;
  texte:           string;
  read_status:     boolean;
  date_created:    string;
}

// ─── Table : messages ─────────────────────────────────────────────
export interface Message {
  message_id:       string;
  sender_id:        string;
  receiver_id:      string;
  texte:            string | null;
  image_url?:       string | null;
  read_status:      boolean;
  delivery_status?: string;
  read_at?:         string | null;
  date_created:     string;
  files?:           MessageFile[];
}

// ─── Table : message_files ────────────────────────────────────────
export interface MessageFile {
  id:         string;
  message_id: string;
  file_url:   string;
  file_name:  string;
  file_type:  string;
  file_size:  number;
  mime_type:  string;
}

// ─── Table : subscriptions (push) ─────────────────────────────────
export interface PushSubscription {
  id:           string;
  user_id:      string;
  endpoint:     string;
  p256dh_key:   string;
  auth_key:     string;
  user_agent?:  string;
  device_type:  string;
  created_at:   string;
}

// ─── Helpers ──────────────────────────────────────────────────────
export interface Session {
  user: {
    id:    string;
    email: string;
  };
}
