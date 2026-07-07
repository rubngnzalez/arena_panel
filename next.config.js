/**
 * Next.js Configuration
 * Arena13 Panel de Gestión de Clientes
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Configuración para GitHub Pages
  output: 'export',
  trailingSlash: true,

  // Imagenes optimizadas
  images: {
    unoptimized: true, // Requerido para export estático
    domains: ['avatars.githubusercontent.com'],
  },

  // Configuración de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },

  // Variables de entorno expuestas al navegador
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'local',
    NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || 'arenatrece.com',
  },

  // Headers para seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
