import { ChannelAdapter, ChannelRegistryEntry, ScrapeResult, StreamSource } from "./types";
import { multicanaishd } from "./multicanaishd";
import { redecanaistv, resolveDooPlaySources } from "./redecanaistv";
import { bbb26shop } from "./bbb26shop";
import { youtube } from "./youtube";

/**
 * Channel Pushing v2 — Adapter Registry
 * 
 * Registro centralizado de adapters e mapeamento de canais.
 * Para adicionar um novo canal ou adapter:
 * 1. Crie o adapter em src/lib/adapters/<nome>.ts
 * 2. Importe e registre em ADAPTER_MAP abaixo
 * 3. Adicione a entrada em CHANNEL_REGISTRY
 */

export async function fetchWithProxy(url: string, init?: RequestInit): Promise<Response> {
    try {
        const res = await fetch(url, init);
        if (res.ok) return res;
        console.warn(`[ProxyFallback] Direct fetch failed for ${url} (Status: ${res.status}).`);
        throw new Error(`HTTP ${res.status}`);
    } catch (e) {
        console.log(`[ProxyFallback] Trying corsproxy.io fallback for ${url}...`);
        const { "Referer": ref, ...safeHeaders } = (init?.headers as Record<string, string>) || {};
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        return fetch(proxyUrl, { ...init, headers: safeHeaders });
    }
}

// ─── Registro de Adapters ───────────────────────────────────
const ADAPTER_MAP: Record<string, ChannelAdapter> = {
    multicanaishd,
    redecanaistv,
    bbb26shop,
    youtube,
};

// ─── Registro de Canais ─────────────────────────────────────
const CHANNEL_REGISTRY: Record<string, ChannelRegistryEntry> = {
    "big-brother-brasil-26": {
        channelPaths: {
            multicanaishd: "big-brother-brasil-26",
            redecanaistv: "bbb-26-5",
            bbb26shop: "bbb26-ao-vivo-bbb26aovivo-bbb-26-ao-vivo-bbb-ao-vivo",
        },
        adapters: ["multicanaishd", "redecanaistv", "bbb26shop"],
    },
    "paramount-plus": {
        channelPaths: {
            redecanaistv: "paramount-plus",
        },
        adapters: ["redecanaistv"],
    },
    "globo": {
        channelPaths: {
            redecanaistv: "globo",
        },
        adapters: ["redecanaistv"],
    },
    "multishow": {
        channelPaths: {
            redecanaistv: "multishow",
        },
        adapters: ["redecanaistv"],
    },
    "hbo": {
        channelPaths: {
            redecanaistv: "hbo",
        },
        adapters: ["redecanaistv"],
    },
    "espn": {
        channelPaths: {
            redecanaistv: "espn",
        },
        adapters: ["redecanaistv"],
    },
    "sportv": {
        channelPaths: {
            redecanaistv: "sportv",
        },
        adapters: ["redecanaistv"],
    },
    "kbs-world-tv": {
        channelPaths: {
            youtube: "@kbsworldtv",
        },
        adapters: ["youtube"],
    },
};

// ─── Mapeamento de Slugs ────────────────────────────────────
const SLUG_ALIASES: Record<string, string> = {
    // BBB
    "big-brother-brasil-26": "big-brother-brasil-26",
    "big brother brasil 26": "big-brother-brasil-26",
    "big brother brasil": "big-brother-brasil-26",
    "bbb 26": "big-brother-brasil-26",
    "bbb26": "big-brother-brasil-26",
    // Paramount+
    "paramount-plus": "paramount-plus",
    "paramount+": "paramount-plus",
    "paramount plus": "paramount-plus",
    "paramount+ plus": "paramount-plus",
    // Globo
    "globo": "globo",
    "canal globo": "globo",
    "tv globo": "globo",
    "rede globo": "globo",
    // Multishow
    "multishow": "multishow",
    "canal multishow": "multishow",
    // HBO
    "hbo": "hbo",
    "hbo max": "hbo",
    "canal hbo": "hbo",
    // ESPN
    "espn": "espn",
    "canal espn": "espn",
    "espn brasil": "espn",
    // SporTV
    "sportv": "sportv",
    "sport tv": "sportv",
    "canal sportv": "sportv",
    // KBS World TV
    "kbs-world-tv": "kbs-world-tv",
    "kbs world tv": "kbs-world-tv",
    "kbs world": "kbs-world-tv",
    "kbsworldtv": "kbs-world-tv",
};

// ─── Cache ──────────────────────────────────────────────────
const scrapeCache = new Map<string, { result: ScrapeResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ─── Funções Públicas ───────────────────────────────────────

/**
 * Resolve um nome/slug de canal para o ID padronizado do registry.
 */
export function resolveChannelSlug(channelName: string): string | null {
    const normalized = channelName.toLowerCase().trim();

    // Match direto
    if (SLUG_ALIASES[normalized]) {
        return SLUG_ALIASES[normalized];
    }

    // Match parcial
    for (const [alias, slug] of Object.entries(SLUG_ALIASES)) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
            return slug;
        }
    }

    // Checar diretamente no registry
    if (CHANNEL_REGISTRY[normalized]) {
        return normalized;
    }

    return null;
}

/**
 * Executa todos os adapters ativos para um canal em paralelo.
 * Mescla os resultados e retorna um ScrapeResult unificado.
 */
export async function scrapeChannel(channelSlug: string): Promise<ScrapeResult> {
    const entry = CHANNEL_REGISTRY[channelSlug];

    if (!entry) {
        return {
            sources: [],
            status: "offline",
            cached: false,
            adaptersUsed: [],
            adaptersFailed: [],
        };
    }

    // Check cache
    const cached = scrapeCache.get(channelSlug);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Registry] Cache hit for ${channelSlug}`);
        return { ...cached.result, cached: true };
    }

    // Filtrar apenas adapters ativos
    const activeAdapterIds = entry.adapters.filter((id) => {
        const adapter = ADAPTER_MAP[id];
        return adapter && adapter.status === "active";
    });

    if (activeAdapterIds.length === 0) {
        console.warn(`[Registry] No active adapters for ${channelSlug}`);
        return {
            sources: [],
            status: "offline",
            cached: false,
            adaptersUsed: [],
            adaptersFailed: entry.adapters,
        };
    }

    console.log(`[Registry] Scraping ${channelSlug} with adapters: ${activeAdapterIds.join(", ")}`);

    // Executar todos em paralelo
    const results = await Promise.allSettled(
        activeAdapterIds.map(async (adapterId) => {
            const adapter = ADAPTER_MAP[adapterId];
            const channelPath = entry.channelPaths[adapterId] || channelSlug;
            const url = adapter.buildUrl(channelPath);

            console.log(`[Registry] Adapter ${adapterId} → ${url}`);

            const response = await fetchWithProxy(url, {
                headers: adapter.getHeaders(),
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} from ${adapter.name}`);
            }

            const html = await response.text();
            let sources = adapter.parseHtml(html, channelPath);

            // DooPlay AJAX resolution for redecanaistv
            if (adapterId === "redecanaistv" && sources.some((s) => s.url.startsWith("__dooplay__:"))) {
                sources = await resolveDooPlaySources(sources, adapter.baseUrl);
            }

            return { adapterId, sources };
        })
    );

    // Mesclar resultados
    const allSources: StreamSource[] = [];
    const adaptersUsed: string[] = [];
    const adaptersFailed: string[] = [];

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const adapterId = activeAdapterIds[i];

        if (result.status === "fulfilled") {
            const { sources } = result.value;
            if (sources.length > 0) {
                allSources.push(...sources);
                adaptersUsed.push(adapterId);
                console.log(`[Registry] ✓ ${adapterId}: ${sources.length} sources`);
            } else {
                adaptersFailed.push(adapterId);
                console.warn(`[Registry] ✗ ${adapterId}: 0 sources (HTML parsed but empty)`);
            }
        } else {
            adaptersFailed.push(adapterId);
            console.error(`[Registry] ✗ ${adapterId}: ${result.reason}`);
        }
    }

    const scrapeResult: ScrapeResult = {
        sources: allSources,
        status: allSources.length > 0 ? "online" : "offline",
        cached: false,
        adaptersUsed,
        adaptersFailed,
    };

    // Atualizar cache apenas se teve sucesso
    if (allSources.length > 0) {
        scrapeCache.set(channelSlug, { result: scrapeResult, timestamp: Date.now() });
    }

    return scrapeResult;
}

/** Lista todos os adapters registrados */
export function listAdapters(): { id: string; name: string; status: string }[] {
    return Object.values(ADAPTER_MAP).map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
    }));
}
