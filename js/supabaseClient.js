// js/supabaseClient.js

// NOTE : Normalement, on utilise la librairie importée via npm.
// Mais pour un projet vanilla simple sans bundler, on peut récupérer l'objet global
// que le script du CDN a mis dans la fenêtre (window).
const { createClient } = supabase;

const supabaseUrl = 'https://cdatvegupstieithpseu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYXR2ZWd1cHN0aWVpdGhwc2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTAwMzEsImV4cCI6MjA3Mzg2NjAzMX0.WMTORU-Uh-Eu5XilPV8UFH21ggFQ8YlhUockriEXdnc';

// Exportation du client pour l'utiliser dans les autres fichiers
export const db = createClient(supabaseUrl, supabaseKey);
