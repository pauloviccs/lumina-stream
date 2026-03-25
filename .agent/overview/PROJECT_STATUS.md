# Project Overview

## Project Name

Lumina Stream

## Description

Plataforma de streaming de vídeo ao vivo e sob demanda, estilo TV por internet (IPTV). Permite que usuários assistam canais de TV e filmes diretamente no navegador via player HLS. Integra-se ao Supabase como backend (autenticação, banco de dados, storage). Usa um sistema modular de adapters para scraping dinâmico de fontes de transmissão.

## Tech Stack

- **Framework:** Next.js 16.1.4 (App Router)
- **Linguagem:** TypeScript 5.x
- **UI Library:** React 19.2.3
- **Estilização:** Tailwind CSS 3.4.1 + tailwindcss-animate
- **Fontes:** Inter (sans) + Outfit (display) — via CSS variables
- **Design Tokens:** HSL-based (shadcn/ui pattern) com dark mode via classe
- **Animações:** Framer Motion 12.29
- **Ícones:** Lucide React
- **Player de Vídeo:** hls.js 1.6.15
- **Backend/BaaS:** Supabase (SSR + client)
- **UI Components extras:** Sonner (toasts), Vaul (drawers)
- **Utilitários:** clsx, tailwind-merge
- **Linting:** ESLint 9 + eslint-config-next
- **Build:** PostCSS + Autoprefixer

## Folder Structure

```text
lumina-stream/
├── .agent/
│   ├── CHANNEL_PUSHING.md     # Docs: sistema de adapters/plugins
│   └── overview/
│       └── PROJECT_STATUS.md  # Este arquivo
├── img/
│   ├── canais/                # Logos/thumbs de canais
│   └── filmes/                # Posters de filmes
├── public/
│   ├── canais/                # Assets públicos de canais
│   └── *.svg                  # Ícones padrão Next.js
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── proxy/         # API route — proxy de streams HLS
│   │   │   └── scrape-stream/ # API route — registry-based scraping
│   │   ├── watch/
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Player principal (server)
│   │   │       └── StreamSelector.tsx # Seletor de fontes (client)
│   │   ├── layout.tsx         # Root layout (fontes, metadata)
│   │   ├── page.tsx           # Homepage
│   │   ├── globals.css        # CSS global + design tokens
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ChannelCard.tsx    # Card de canal
│   │   ├── ChannelCarousel.tsx # Carrossel de canais
│   │   ├── HeroSection.tsx    # Hero da homepage
│   │   └── VideoPlayer.tsx    # Player HLS (referer declarativo)
│   ├── lib/
│   │   ├── adapters/          # ← NOVO: Sistema de plugins
│   │   │   ├── types.ts       # Interfaces base
│   │   │   ├── registry.ts    # Registro central + execução paralela
│   │   │   ├── multicanaishd.ts  # Adapter multicanaishd.best
│   │   │   ├── redecanaistv.ts   # Adapter redecanaistv.in
│   │   │   └── bbb26shop.ts     # Adapter bbb26.shop (blocked)
│   │   └── utils.ts           # cn() helper (clsx + tailwind-merge)
│   ├── types/
│   │   └── supabase.ts        # Tipos gerados do Supabase
│   └── utils/
│       └── supabase/
│           ├── client.ts      # Supabase client-side
│           └── server.ts      # Supabase server-side (cookies)
├── tailwind.config.ts         # Config Tailwind com design tokens
├── next.config.ts             # Config Next.js (remote images)
├── tsconfig.json
├── package.json
├── .env.local                 # Variáveis de ambiente (Supabase keys)
└── seed_fix.js                # Script utilitário de seed
```

## Current Features Implemented

- **Homepage** com hero section e carrossel de canais (dados do Supabase)
- **Player de vídeo HLS** com suporte a múltiplas fontes/streams por canal
- **Página dinâmica `/watch/[id]`** com seletor de fonte e seletor de stream
- **Sistema de Adapters** modular para scraping dinâmico (v2)
  - Adapters executados em paralelo via `Promise.allSettled`
  - Cache in-memory de 5 minutos
  - Referer declarativo passado ao proxy CORS
  - Estado "Transmissões Offline" quando todos os adapters falham
  - Loading state animado ("Puxando Sinal HD...")
  - Fade-in Framer Motion na troca de fontes
- **API Proxy** (`/api/proxy`) para contornar CORS em streams HLS
- **API Scrape** (`/api/scrape-stream`) — delega ao registry de adapters
- **Integração Supabase** — dados de canal apenas (sem fallback de fontes)
- **Design system** HSL-based com dark mode, fontes Inter/Outfit, e tokens de cor
- **Touch targets** mínimos de 44px nos botões de fonte (acessibilidade mobile)
- **Animações** com Framer Motion nos componentes visuais
- **Toasts** (Sonner) e **Drawers** (Vaul) disponíveis

## Work-in-Progress

- Ativação do adapter bbb26shop (Cloudflare challenge bypass)
- Expansão do catálogo de canais e filmes
- Possível migração do scraping para Supabase Edge Functions com cron

## Known TODOs / Missing Parts

- Autenticação de usuário não implementada (Supabase Auth configurado mas sem fluxo de login)
- Sem testes automatizados (unit/e2e)
- `scrape_result.json`, `temp_html.txt` e `manifest_test.txt` na raiz são artefatos de debug — devem ser removidos
- Sem PWA/manifest configurado
- Sem CI/CD pipeline
- Cache in-memory não persiste entre serverless lambdas (Vercel) — futuro: Edge Function com cron

---

*Última atualização: 2026-03-25*
