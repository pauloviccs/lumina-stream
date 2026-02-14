# Channel Pushing — Big Brother Brasil 26

Documentação detalhada do método e stack usados para adicionar as transmissões (fontes de stream) ao canal BBB 26 no Lumina Stream.

---

## Visão Geral do Fluxo

O BBB 26 usa um **pipeline de scraping dinâmico** — as fontes de transmissão **não ficam salvas no Supabase**. Elas são extraídas em tempo real de um site externo a cada acesso à página do canal.

```
Usuário abre /watch/[id]
        │
        ▼
   ┌─────────────────────┐
   │  page.tsx (Server)   │ ← Detecta se o canal suporta scraping
   │  getScrapableSlug()  │
   └──────────┬──────────┘
              │ sim
              ▼
   ┌─────────────────────────────┐
   │  GET /api/scrape-stream     │ ← Faz fetch do HTML do site fonte
   │  ?channel=big-brother-...   │
   └──────────┬──────────────────┘
              │
              ▼
   ┌──────────────────────────────────┐
   │  Regex extrai data-url e labels  │ ← Até 10 fontes
   │  Retorna array de StreamSource[] │
   └──────────┬───────────────────────┘
              │
              ▼
   ┌───────────────────────────┐
   │  StreamSelector (Client)  │ ← Renderiza player ou iframe
   │  + VideoPlayer ou iframe  │
   └───────────────────────────┘
```

---

## Camadas do Pipeline

### 1. Detecção de Canal Scrapável — `page.tsx`

**Arquivo:** `src/app/watch/[id]/page.tsx`

O mapeamento `SCRAPE_SUPPORTED_CHANNELS` define quais canais usam scraping:

```ts
const SCRAPE_SUPPORTED_CHANNELS: Record<string, string> = {
    "big-brother-brasil-26": "big-brother-brasil-26",
    "big brother brasil 26": "big-brother-brasil-26",
    "bbb 26": "big-brother-brasil-26",
    "bbb26": "big-brother-brasil-26",
};
```

A função `getScrapableSlug()` faz match exato ou parcial no nome do canal. Se encontrar, chama a API interna.

---

### 2. Scraper API — `/api/scrape-stream`

**Arquivo:** `src/app/api/scrape-stream/route.ts`

| Item | Detalhe |
|------|---------|
| **URL fonte** | `https://multicanaishd.best/canal/big-brother-brasil-26/` |
| **Método** | `GET` com headers de browser (User-Agent Chrome, Referer, Accept-Language pt-BR) |
| **Extração** | Regex: `data-url=["']([^"']+)["'][^>]*>([^<]+)` — captura URL e label dos links |
| **Limite** | Máximo 10 fontes por request |
| **Cache** | In-memory Map com TTL de 5 minutos |
| **Tipo de fonte** | Todas retornam como `type: "iframe"` (streams são IP-locked, m3u8 direto não funciona) |

**Formato de retorno:**

```json
{
  "sources": [
    { "id": "iframe-1", "label": "Opção 1", "url": "https://...", "quality": "HD", "type": "iframe" },
    { "id": "iframe-2", "label": "Opção 2", "url": "https://...", "quality": "HD", "type": "iframe" }
  ],
  "cached": false
}
```

**Fallback:** Se o scraper não retornar fontes, o sistema usa as fontes estáticas do Supabase (tabela `stream_sources`).

---

### 3. Proxy CORS — `/api/proxy`

**Arquivo:** `src/app/api/proxy/route.ts`

Usado quando o tipo da fonte é `m3u8` (não é o caso atual do BBB que usa iframes). O proxy:

- Recebe `?url=<stream_url>&referer=<referer>`
- Faz fetch com headers corretos (User-Agent, Referer, Origin)
- Para manifestos `.m3u8`: reescreve URLs internas para passar pelo proxy
- Para segmentos `.ts`: faz pass-through binário
- Adiciona `Access-Control-Allow-Origin: *`

**Mapa de Referers conhecidos:**

| Domínio | Referer |
|---------|---------|
| `vipcanaisplay.site` | `embedtvonline.com` |
| `imgcontent.xyz` | `rdcanais.top` |
| `nossoplayeronlinehd` | `nossoplayeronlinehd.online` |
| `meuplayeronlinehd` | `meuplayeronlinehd.com` |
| fallback | `multicanaishd.best` |

---

### 4. Renderização — `StreamSelector.tsx`

**Arquivo:** `src/app/watch/[id]/StreamSelector.tsx`

Decide como exibir a fonte baseado no `type`:

| Tipo | Renderização |
|------|-------------|
| `iframe` | `<iframe>` embed direto do player externo |
| `m3u8` ou undefined | `<VideoPlayer>` com hls.js via proxy |

O BBB atual usa **100% iframe** porque os streams são IP-locked.

---

### 5. Banco de Dados (Fallback) — Supabase

**Tabelas envolvidas:**

#### `channels`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK — usado na rota `/watch/[id]` |
| `name` | text | Ex: "Big Brother Brasil 26" |
| `category` | text | Ex: "Reality Show" |
| `logo_url` | text? | URL do logo |
| `image_color` | text | Cor de fundo hex |
| `is_featured` | bool | Destaque na homepage |

#### `stream_sources`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK |
| `channel_id` | uuid | FK → channels.id |
| `label` | text | Ex: "Opção 1" |
| `url` | text | URL do stream (m3u8 ou iframe) |
| `quality` | text | Ex: "HD", "SD" |
| `type` | text | "hls" ou "iframe" |

> **Nota:** Para o BBB, as fontes do Supabase servem apenas como **fallback**. O scraper dinâmico tem prioridade.

---

## Como Adicionar um Novo Canal com Scraping

1. **Adicionar o canal no Supabase** (tabela `channels`) com nome, categoria, logo, etc.
2. **Mapear o slug** em dois lugares:
   - `SCRAPE_SUPPORTED_CHANNELS` em `page.tsx` — para detecção server-side
   - `CHANNEL_MAP` em `scrape-stream/route.ts` — para resolver a URL fonte
3. **Identificar a estrutura HTML** do site fonte e ajustar o regex se necessário
4. **Testar** acessando `/api/scrape-stream?channel=<slug>` diretamente
5. **Opcional:** Adicionar domínios de stream no `REFERER_MAP` do proxy se usar m3u8

---

## Stack Tecnológico Resumido

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 |
| Player HLS | hls.js 1.6 |
| Player Iframe | `<iframe>` nativo |
| Scraping | Server-side `fetch` + Regex (Node.js runtime) |
| Proxy CORS | Next.js API Route com rewrite de manifesto |
| Cache | In-memory `Map` (TTL 5min) |
| Banco de dados | Supabase (PostgreSQL) |
| Deploy | Vercel (serverless) |

---

*Última atualização: 2026-02-14*
