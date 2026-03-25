import { ChannelAdapter, StreamSource } from "./types";

/**
 * Adapter: MultiCanais HD
 * Site: https://multicanaishd.best
 * 
 * Extrai fontes de transmissão via regex em data-url attributes.
 * Este é o adapter original — mesma lógica que já funcionava.
 */
export const multicanaishd: ChannelAdapter = {
    id: "multicanaishd",
    name: "MultiCanais HD",
    baseUrl: "https://multicanaishd.best",
    status: "active",

    buildUrl(channelPath: string): string {
        return `${this.baseUrl}/canal/${channelPath}/`;
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
        // STRATEGY: Extract player URLs from data-url attributes
        // Pattern: <a href="javascript:void(0);" data-url="URL" rel="nofollow">Label</a>
        const playerUrlRegex = /data-url=["']([^"']+)["'][^>]*>([^<]+)/gi;
        const matches = [...html.matchAll(playerUrlRegex)];

        if (matches.length === 0) {
            console.warn(`[Adapter:multicanaishd] No data-url matches for ${channelPath}`);
            return [];
        }

        const sources: StreamSource[] = [];

        for (let i = 0; i < matches.length && i < 10; i++) {
            const match = matches[i];
            let playerUrl = match[1];
            const label = match[2].trim();

            // Ensure valid URL
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

        console.log(`[Adapter:multicanaishd] Extracted ${sources.length} sources for ${channelPath}`);
        return sources;
    },
};
