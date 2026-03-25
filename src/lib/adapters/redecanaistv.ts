import { ChannelAdapter, StreamSource } from "./types";
import { fetchWithProxy } from "./registry";

/**
 * Adapter: RedeCanais TV (DooPlay)
 * Site: https://www6.redecanaistv.in
 * 
 * Two-step scraping:
 * 1. GET da página → extrai dooplay_player_option (data-post, data-nume, data-type + label)
 * 2. POST em /wp-admin/admin-ajax.php com action=doo_player_ajax → retorna embed_url
 */

export const redecanaistv: ChannelAdapter = {
    id: "redecanaistv",
    name: "RedeCanais TV",
    baseUrl: "https://www6.redecanaistv.in",
    status: "active",

    buildUrl(channelPath: string): string {
        return `${this.baseUrl}/ao-vivo/${channelPath}/`;
    },

    getHeaders(): HeadersInit {
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Upgrade-Insecure-Requests": "1",
            "Referer": "https://www.google.com/",
        };
    },

    getChannelPath(registryPath: string): string {
        return registryPath;
    },

    parseHtml(html: string, channelPath: string): StreamSource[] {
        // Step 1: Extract DooPlay player options from the HTML
        // Pattern: <li id='player-option-N' class='dooplay_player_option ...' 
        //          data-type='movie' data-post='49' data-nume='1'>
        //          <span class='title'>Câmera 1 (Acompanhe a casa)</span>
        const optionRegex = /class='dooplay_player_option[^']*'[^>]*data-type='([^']*)'[^>]*data-post='([^']*)'[^>]*data-nume='([^']*)'[^>]*>[\s\S]*?<span class='title'>([^<]*)<\/span>/gi;
        // Limit to 6 matches max to prevent Vercel timeouts and Cloudflare IP blocks (DDoS protection)
        const matches = [...html.matchAll(optionRegex)].slice(0, 6);

        if (matches.length === 0) {
            console.warn(`[Adapter:redecanaistv] No dooplay_player_option found for ${channelPath}`);
            console.log(`[Adapter:redecanaistv] HTML Snapshot: ${html.substring(0, 300).replace(/\n/g, ' ')}...`);
            return [];
        }

        console.log(`[Adapter:redecanaistv] Found ${matches.length} DooPlay options for ${channelPath}`);

        // Return placeholder sources with metadata for AJAX resolution
        // The registry will call resolveAjaxSources() to get the real URLs
        return matches.map((m, i) => ({
            id: `${this.id}-${i + 1}`,
            label: m[4].trim(),
            // Store AJAX params in the URL temporarily — will be resolved
            url: `__dooplay__:${m[1]}:${m[2]}:${m[3]}`,
            quality: "HD",
            type: "iframe" as const,
            referer: "https://redecanaistv.fm/",
            adapterId: this.id,
        }));
    },
};

/**
 * Resolve DooPlay placeholder URLs to real embed URLs via AJAX.
 * Called by the registry after parseHtml.
 */
export async function resolveDooPlaySources(
    sources: StreamSource[],
    siteBaseUrl: string
): Promise<StreamSource[]> {
    const dooplaySources = sources.filter((s) => s.url.startsWith("__dooplay__:"));
    const otherSources = sources.filter((s) => !s.url.startsWith("__dooplay__:"));

    if (dooplaySources.length === 0) return sources;

    console.log(`[Adapter:redecanaistv] Resolving ${dooplaySources.length} DooPlay URLs via AJAX...`);

    const resolved = await Promise.allSettled(
        dooplaySources.map(async (source) => {
            const [, type, post, nume] = source.url.split(":");

            const response = await fetch(`${siteBaseUrl}/wp-admin/admin-ajax.php`, {
                method: "POST",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Referer": `${siteBaseUrl}/`,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: `action=doo_player_ajax&post=${post}&nume=${nume}&type=${type}`,
                signal: AbortSignal.timeout(4000),
            });

            if (!response.ok) {
                throw new Error(`AJAX ${response.status} for nume=${nume}`);
            }

            const data = await response.json();
            const embedUrl = data.embed_url;

            if (!embedUrl) {
                throw new Error(`No embed_url in AJAX response for nume=${nume}`);
            }

            console.log(`[Adapter:redecanaistv] ✓ ${source.label} → ${embedUrl.substring(0, 60)}...`);

            return {
                ...source,
                url: embedUrl,
            };
        })
    );

    const resolvedSources: StreamSource[] = [...otherSources];
    for (const result of resolved) {
        if (result.status === "fulfilled") {
            resolvedSources.push(result.value);
        } else {
            console.warn(`[Adapter:redecanaistv] AJAX resolve failed: ${result.reason}`);
        }
    }

    console.log(`[Adapter:redecanaistv] Resolved ${resolvedSources.length} total sources`);
    return resolvedSources;
}
