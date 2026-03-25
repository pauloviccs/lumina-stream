import { ChannelAdapter, StreamSource } from "./types";

/**
 * Adapter: YouTube Live
 * 
 * Extrai o live stream de um canal do YouTube.
 * Funciona buscando a página do canal e extraindo o videoId do live stream,
 * que é então embedado via iframe do YouTube (youtube.com/embed/VIDEO_ID).
 */
export const youtube: ChannelAdapter = {
    id: "youtube",
    name: "YouTube Live",
    baseUrl: "https://www.youtube.com",
    status: "active",

    buildUrl(channelPath: string): string {
        // channelPath pode ser: @handle, channel/ID, ou handle direto
        if (channelPath.startsWith("@") || channelPath.startsWith("channel/")) {
            return `${this.baseUrl}/${channelPath}/live`;
        }
        return `${this.baseUrl}/@${channelPath}/live`;
    },

    getHeaders(): HeadersInit {
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "identity",
        };
    },

    getChannelPath(registryPath: string): string {
        return registryPath;
    },

    parseHtml(html: string, channelPath: string): StreamSource[] {
        // YouTube embeds the videoId in various places for live streams
        // Pattern 1: "videoId":"XXXXXXXXXXX" in the initial data
        const videoIdMatch = html.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);

        if (!videoIdMatch) {
            // Pattern 2: canonical URL with /watch?v=
            const canonicalMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
            if (!canonicalMatch) {
                console.warn(`[Adapter:youtube] No live videoId found for ${channelPath}`);
                return [];
            }
            const videoId = canonicalMatch[1];
            return [{
                id: `${this.id}-1`,
                label: "YouTube Live",
                url: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
                quality: "HD",
                type: "iframe",
                adapterId: this.id,
            }];
        }

        const videoId = videoIdMatch[1];

        // Check if it's actually live
        const isLive = html.includes('"isLive":true') || html.includes('"isLiveContent":true');

        if (!isLive) {
            console.warn(`[Adapter:youtube] Channel ${channelPath} is not currently live`);
            // Still return the embed — could be a premiere or recent stream
        }

        // Extract channel/video title
        const titleMatch = html.match(/"title"\s*:\s*"([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : "Live";

        console.log(`[Adapter:youtube] Found live stream: ${videoId} - "${title}" (live: ${isLive})`);

        return [{
            id: `${this.id}-1`,
            label: title.length > 40 ? title.substring(0, 37) + "..." : title,
            url: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
            quality: "HD",
            type: "iframe",
            adapterId: this.id,
        }];
    },
};
