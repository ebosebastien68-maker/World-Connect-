const fs = require('fs');
const path = require('path');

// 1. Vérifier que les variables d'environnement sont bien définies
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Erreur : la variable d\'environnement SUPABASE_URL est manquante.');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Erreur : la variable d\'environnement SUPABASE_ANON_KEY est manquante.');
  process.exit(1);
}

// 2. Définir le chemin du fichier à modifier
const targetFile = path.join(__dirname, 'supabaseClient.js');

// 3. Vérifier que le fichier source existe
if (!fs.existsSync(targetFile)) {
  console.error('❌ Erreur : le fichier supabaseClient.js est introuvable.');
  process.exit(1);
}

// 4. Lire le contenu actuel du fichier
let code = fs.readFileSync(targetFile, 'utf8');

// 5. Vérifier que les marqueurs sont bien présents dans le fichier
if (!code.includes('__SUPABASE_URL__') || !code.includes('__SUPABASE_ANON_KEY__')) {
  console.error('❌ Erreur : les marqueurs __SUPABASE_URL__ ou __SUPABASE_ANON_KEY__ sont absents de supabaseClient.js.');
  process.exit(1);
}

// 6. Remplacer les marqueurs par les variables d'environnement Vercel
code = code.replace('__SUPABASE_URL__', SUPABASE_URL);
code = code.replace('__SUPABASE_ANON_KEY__', SUPABASE_ANON_KEY);

// 7. Sauvegarder le fichier modifié
fs.writeFileSync(targetFile, code, 'utf8');

console.log('🚀 Injection des clés réussie dans supabaseClient.js !');
console.log(`   ✅ SUPABASE_URL      → ${SUPABASE_URL}`);
console.log(`   ✅ SUPABASE_ANON_KEY → ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
