# Channel Pushing v2 — Sistema de Plugins/Adapters

Documentação do sistema de scraping modular do Lumina Stream. Cada fonte de transmissão é gerenciada por um **adapter** isolado.

---

## Visão Geral do Fluxo

```
Usuário abre /watch/[id]
        │
        ▼
   ┌─────────────────────────┐
   │  page.tsx (Server)       │ ← resolveChannelSlug() do registry
   └──────────┬──────────────┘
              │ canal suporta scraping?
              ▼
   ┌──────────────────────────────┐
   │  GET /api/scrape-stream       │ ← Chama registry.scrapeChannel()
   │  ?channel=big-brother-...     │
   └──────────┬───────────────────┘
              │
              ▼
   ┌────────────────────────────────────┐
   │  Registry executa adapters em      │
   │  PARALELO (Promise.allSettled)     │
   │                                    │
   │  ┌───────────────┐ ┌────────────┐ │
   │  │ multicanaishd  │ │redecanaistv│ │
   │  │  (regex)       │ │  (regex)   │ │
   │  └───────┬───────┘ └─────┬──────┘ │
   │          └───────┬───────┘         │
   │                  ▼                 │
   │        Mescla StreamSource[]       │
   │        + cache 5 min               │
   └──────────┬─────────────────────────┘
              │
              ▼
   ┌────────────────────────────────┐
   │  StreamSelector (Client)       │
   │  • sources → Player/iframe     │
   │  • [] + offline → Tela Offline │
   │  • Fade-in Framer Motion       │
   └────────────────────────────────┘
```

---

## Arquitetura de Adapters

### Pasta: `src/lib/adapters/`

| Arquivo | Descrição |
|---------|-----------|
| `types.ts` | Interfaces: `ChannelAdapter`, `StreamSource`, `ScrapeResult` |
| `registry.ts` | Registro central: mapeamento de canais → adapters, cache, execução paralela |
| `multicanaishd.ts` | Adapter para multicanaishd.best |
| `redecanaistv.ts` | Adapter para redecanaistv.in |
| `bbb26shop.ts` | Adapter para bbb26.shop (⚠️ **blocked** — Cloudflare) |

### Interface `ChannelAdapter`

```ts
interface ChannelAdapter {
    id: string;          // "multicanaishd"
    name: string;        // "MultiCanais HD"
    baseUrl: string;     // "https://multicanaishd.best"
    status: "active" | "blocked" | "deprecated";
    buildUrl(channelPath: string): string;
    parseHtml(html: string, channelPath: string): StreamSource[];
    getHeaders(): HeadersInit;
    getChannelPath(registryPath: string): string;
}
```

### Interface `StreamSource` (v2)

```ts
interface StreamSource {
    id: string;
    label: string;
    url: string;
    quality: string;
    type: "m3u8" | "iframe";
    referer?: string;     // ← NOVO: Referer declarativo para o proxy
    adapterId?: string;   // ← NOVO: ID do adapter que gerou esta fonte
}
```

---

## Adapters Ativos

| Adapter | Site | Status | Tipo |
|---------|------|--------|------|
| `multicanaishd` | multicanaishd.best | ✅ Active | iframe (data-url regex) |
| `redecanaistv` | www6.redecanaistv.in | ✅ Active | iframe (data-url regex + iframe fallback) |
| `bbb26shop` | bbb26.shop | ⚠️ Blocked | Cloudflare Challenge |

---

## Como Adicionar um Novo Canal

1. **Adicionar o canal no Supabase** (tabela `channels`) — nome, categoria, logo
2. **Criar adapter** (se o site-fonte é novo):
   - Copiar `src/lib/adapters/multicanaishd.ts` como template
   - Ajustar `id`, `name`, `baseUrl`, `buildUrl()`, `parseHtml()`
   - Identificar regex/padrão HTML do site
3. **Registrar no registry** (`src/lib/adapters/registry.ts`):
   - Importar o novo adapter
   - Adicionar ao `ADAPTER_MAP`
   - Adicionar entrada em `CHANNEL_REGISTRY` com paths por adapter
   - Adicionar aliases de slug em `SLUG_ALIASES`
4. **Testar**: `http://localhost:3000/api/scrape-stream?channel=<slug>`
5. **Opcional**: Adicionar domínios no `REFERER_MAP` do proxy se usar m3u8

---

## Como Adicionar um Novo Adapter

```ts
// src/lib/adapters/meusite.ts
import { ChannelAdapter, StreamSource } from "./types";

export const meusite: ChannelAdapter = {
    id: "meusite",
    name: "Meu Site TV",
    baseUrl: "https://meusitetv.com",
    status: "active",

    buildUrl(channelPath) {
        return `${this.baseUrl}/canal/${channelPath}/`;
    },

    getHeaders() {
        return {
            "User-Agent": "Mozilla/5.0 ...",
            "Referer": `${this.baseUrl}/`,
        };
    },

    getChannelPath(registryPath) {
        return registryPath;
    },

    parseHtml(html, channelPath) {
        // Seu regex ou parser aqui
        const regex = /data-url=["']([^"']+)["'][^>]*>([^<]+)/gi;
        const matches = [...html.matchAll(regex)];
        return matches.map((m, i) => ({
            id: `${this.id}-${i + 1}`,
            label: m[2].trim(),
            url: m[1].startsWith("http") ? m[1] : `https:${m[1]}`,
            quality: "HD",
            type: "iframe" as const,
            referer: `${this.baseUrl}/`,
            adapterId: this.id,
        }));
    },
};
```

---

## Pipeline Técnico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 |
| Player HLS | hls.js 1.6 com referer declarativo |
| Player Iframe | `<iframe>` nativo com fade-in Framer Motion |
| Adapters | TypeScript modules isolados (1 por site-fonte) |
| Registry | Execução paralela `Promise.allSettled` + cache Map 5min |
| Proxy CORS | Next.js API Route com `?referer=` override |
| UI States | Loading ("Puxando Sinal HD...") / Offline ("Transmissões Offline") |
| Banco de dados | Supabase (PostgreSQL) — apenas dados de canal, **sem fallback de fontes** |
| Deploy | Vercel (serverless) |

---

*Última atualização: 2026-03-25*
