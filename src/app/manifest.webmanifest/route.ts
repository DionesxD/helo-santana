import { NextResponse } from 'next/server'

// Serve manifest.webmanifest como rota da API (evita CORS/SSO da Vercel em team accounts)
export async function GET() {
  const manifest = {
    name: 'Helo Santana — Nail Designer',
    short_name: 'Helo Santana',
    description: 'Agendamentos, provador de cores e histórico de atendimentos',
    start_url: '/',
    display: 'standalone',
    background_color: '#211814',
    theme_color: '#D85A78',
    icons: [
      { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { src: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
