import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // ─── TypeScript & ESLint ───────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ─── Expérimental ─────────────────────────────────────────────────
  experimental: {
    typedRoutes: true,           // autocomplétion des routes (App Router)
    optimizePackageImports: [    // tree-shaking automatique
      "lucide-react",
      "@heroicons/react",
      "react-icons",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@tanstack/react-query",
      "motion",
      "recharts",
    ],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // ─── Images ───────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
    remotePatterns: [
      // Ajoute tes domaines ici
      // { protocol: "https", hostname: "ton-bucket.s3.amazonaws.com" },
    ],
  },

  // ─── Headers de sécurité ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https:",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
      // Cache statique long pour les assets
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache médias
      {
        source: "/media/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },
    ];
  },

  // ─── Redirects ────────────────────────────────────────────────────
  async redirects() {
    return [
      // Exemple : rediriger /home vers /
      // { source: "/home", destination: "/", permanent: true },
    ];
  },

  // ─── Rewrites ─────────────────────────────────────────────────────
  async rewrites() {
    return [
      // Exemple : proxy vers une API interne
      // { source: "/api/:path*", destination: "http://localhost:4000/:path*" },
    ];
  },

  // ─── Webpack ──────────────────────────────────────────────────────
  webpack(config) {
    // Support SVG as React components
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    // Alias @
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };

    return config;
  },

  // ─── Variables d'environnement publiques ──────────────────────────
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // ─── Compression & Output ─────────────────────────────────────────
  compress: true,
  poweredByHeader: false,       // retire le header X-Powered-By
  reactStrictMode: true,
  output: "standalone",         // build optimisé pour Docker/Render
};

export default nextConfig;
