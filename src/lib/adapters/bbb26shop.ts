import { ChannelAdapter, StreamSource } from "./types";

/**
 * Adapter: BBB26 Shop
 * Site: https://bbb26.shop
 * 
 * ⚠️ STATUS: BLOCKED
 * Este site está atrás de Cloudflare Challenge.
 * Fetch direto retorna página de verificação (403/503).
 * Adapter estruturado para ativação futura quando houver
 * solução de bypass (ex: cookies manuais, puppeteer).
 */
export const bbb26shop: ChannelAdapter = {
    id: "bbb26shop",
    name: "BBB26 Shop",
    baseUrl: "https://bbb26.shop",
    status: "blocked",

    buildUrl(channelPath: string): string {
        return `${this.baseUrl}/aovivo/${channelPath}/`;
    },

    getHeaders(): HeadersInit {
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": `${this.baseUrl}/`,
        };
    },

    getChannelPath(registryPath: string): string {
        return registryPath;
    },

    parseHtml(html: string, channelPath: string): StreamSource[] {
        // Typical WordPress/streaming site: data-url or iframe-based players
        const playerUrlRegex = /data-url=["']([^"']+)["'][^>]*>([^<]+)/gi;
        const matches = [...html.matchAll(playerUrlRegex)];

        if (matches.length === 0) {
            // Fallback: iframe src extraction
            const iframeRegex = /<iframe[^>]+src=["']([^"']+(?:player|embed|watch|live)[^"']*)["'][^>]*>/gi;
            const iframeMatches = [...html.matchAll(iframeRegex)];

            const sources: StreamSource[] = [];
            for (let i = 0; i < iframeMatches.length && i < 10; i++) {
                let iframeUrl = iframeMatches[i][1];
                if (!iframeUrl.startsWith("http")) {
                    if (iframeUrl.startsWith("//")) {
                        iframeUrl = "https:" + iframeUrl;
                    } else {
                        continue;
                    }
                }
                if (iframeUrl.includes("google") || iframeUrl.includes("facebook")) continue;

                sources.push({
                    id: `${this.id}-${i + 1}`,
                    label: `BBB Shop ${i + 1}`,
                    url: iframeUrl,
                    quality: "HD",
                    type: "iframe",
                    referer: `${this.baseUrl}/`,
                    adapterId: this.id,
                });
            }
            return sources;
        }

        const sources: StreamSource[] = [];
        for (let i = 0; i < matches.length && i < 10; i++) {
            let playerUrl = matches[i][1];
            const label = matches[i][2].trim();

            if (!playerUrl.startsWith("http")) {
                if (playerUrl.startsWith("//")) {
                    playerUrl = "https:" + playerUrl;
                } else {
                    continue;
                }
            }

            sources.push({
                id: `${this.id}-${i + 1}`,
                label,
                url: playerUrl,
                quality: "HD",
                type: "iframe",
                referer: `${this.baseUrl}/`,
                adapterId: this.id,
            });
        }

        console.log(`[Adapter:bbb26shop] Extracted ${sources.length} sources for ${channelPath}`);
        return sources;
    },
};
