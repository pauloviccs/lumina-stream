# Project Overview

## Project Name
Lumina Stream

## Description
Plataforma de streaming de vídeo ao vivo e sob demanda, estilo TV por internet (IPTV). Permite que usuários assistam canais de TV e filmes diretamente no navegador via player HLS. Integra-se ao Supabase como backend (autenticação, banco de dados, storage).

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
├── .agent/                    # Configurações do agente
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
│   │   │   └── scrape-stream/ # API route — scraping de URLs de stream
│   │   ├── watch/
│   │   │   └── [id]/          # Página dinâmica do player
│   │   │       ├── page.tsx         # Player principal
│   │   │       ├── SourceSelector.tsx
│   │   │       └── StreamSelector.tsx
│   │   ├── layout.tsx         # Root layout (fontes, metadata)
│   │   ├── page.tsx           # Homepage
│   │   ├── globals.css        # CSS global + design tokens
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ChannelCard.tsx    # Card de canal
│   │   ├── ChannelCarousel.tsx # Carrossel de canais
│   │   ├── HeroSection.tsx    # Hero da homepage
│   │   └── VideoPlayer.tsx    # Player HLS reutilizável
│   ├── lib/
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
- **API Proxy** (`/api/proxy`) para contornar CORS em streams HLS
- **API Scrape** (`/api/scrape-stream`) para extrair URLs de stream de páginas externas
- **Integração Supabase** completa (client + server via SSR)
- **Design system** HSL-based com dark mode, fontes Inter/Outfit, e tokens de cor
- **Animações** com Framer Motion nos componentes visuais
- **Toasts** (Sonner) e **Drawers** (Vaul) disponíveis

## Work-in-Progress
- Refinamento da UI do player e seletores de stream
- Expansão do catálogo de canais e filmes
- Possível implementação de autenticação de usuário

## Known TODOs / Missing Parts
- Autenticação de usuário não implementada (Supabase Auth está configurado mas sem fluxo de login)
- Sem testes automatizados (unit/e2e)
- Arquivo `scrape_result.json` e `temp_html.txt` na raiz são artefatos de debug — devem ser removidos ou adicionados ao `.gitignore`
- `manifest_test.txt` na raiz parece ser artefato temporário
- Sem PWA/manifest configurado
- Sem CI/CD pipeline

---
*Última atualização: 2026-02-14*
