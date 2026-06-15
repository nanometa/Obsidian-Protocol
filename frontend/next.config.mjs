import * as path from "node:path";
import * as dotenv from "dotenv";

// En local dev : charge le .env parent (Hardhat + frontend partagent les vars)
// En production (Vercel) : les variables sont injectées directement par Vercel
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(process.cwd(), "..", ".env"), quiet: true });
}

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on"
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https: wss:",
      "img-src 'self' data: blob:",
      "frame-src 'none'"
    ].join("; ")
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  }
];

const nobleCurvesDir = path.resolve(process.cwd(), "node_modules", "@noble", "curves");
const nobleEd25519Compat = path.resolve(process.cwd(), "lib", "noble-ed25519-compat.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["age-encryption", "@noble/curves", "@noble/hashes"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "@react-native-async-storage/async-storage$": false,
      "@noble/curves/ed25519": nobleEd25519Compat,
      "@noble/curves/ed25519.js": path.join(nobleCurvesDir, "ed25519.js"),
      "@noble/curves/secp256k1": path.join(nobleCurvesDir, "secp256k1.js"),
      "@noble/curves/secp256k1.js": path.join(nobleCurvesDir, "secp256k1.js"),
      "pino-pretty": false
    };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@circle-fin/app-kit$": false,
        "@react-native-async-storage/async-storage": false,
        "@react-native-async-storage/async-storage$": false
      };
    }

    return config;
  }
};

export default nextConfig;
