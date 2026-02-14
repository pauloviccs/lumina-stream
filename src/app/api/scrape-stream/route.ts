import { NextRequest, NextResponse } from "next/server";

// Channel mapping: slug -> URL path on source site
const CHANNEL_MAP: Record<string, string> = {
    "big-brother-brasil-26": "big-brother-brasil-26",
    "bbb26": "big-brother-brasil-26",
    // Add more channels as needed
};

// Cache to avoid hammering the source
const streamCache = new Map<string, { sources: StreamSource[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface StreamSource {
    id: string;
    label: string;
    url: string;
    quality: string;
    type: "m3u8" | "iframe"; // m3u8 for HLS streams, iframe for embedded players
}

export async function GET(request: NextRequest) {
    const channelSlug = request.nextUrl.searchParams.get("channel");

    if (!channelSlug) {
        return NextResponse.json({ error: "Missing channel parameter" }, { status: 400 });
    }

    const channelPath = CHANNEL_MAP[channelSlug.toLowerCase()];
    if (!channelPath) {
        return NextResponse.json({ error: "Unknown channel" }, { status: 404 });
    }

    // Check cache first
    const cached = streamCache.get(channelPath);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Scraper] Cache hit for ${channelPath}`);
        return NextResponse.json({ sources: cached.sources, cached: true });
    }

    try {
        console.log(`[Scraper] Fetching streams for ${channelPath}...`);

        const sourceUrl = `https://multicanaishd.best/canal/${channelPath}/`;

        // Fetch the page HTML
        const response = await fetch(sourceUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "Referer": "https://multicanaishd.best/",
            },
        });

        if (!response.ok) {
            console.error(`[Scraper] Failed to fetch page: ${response.status}`);
            return NextResponse.json({ error: "Failed to fetch source page" }, { status: 502 });
        }

        const html = await response.text();

        // STRATEGY: Extract player URLs from data-url attributes
        // Pattern: <a href="javascript:void(0);" data-url="URL" rel="nofollow">Label</a>
        const playerUrlRegex = /data-url=["']([^"']+)["'][^>]*>([^<]+)/gi;
        const playerMatches = [...html.matchAll(playerUrlRegex)];

        if (playerMatches.length === 0) {
            console.warn(`[Scraper] No player URLs found for ${channelPath}`);
            return NextResponse.json({
                error: "No player URLs found",
                hint: "The source site structure may have changed"
            }, { status: 404 });
        }

        console.log(`[Scraper] Found ${playerMatches.length} player URLs, extracting streams...`);

        // Extract streams from all player URLs found
        const sources: StreamSource[] = [];

        for (let i = 0; i < playerMatches.length; i++) {
            const match = playerMatches[i];
            let playerUrl = match[1];
            const label = match[2].trim();

            console.log(`[Scraper] Processing ${label}: ${playerUrl}`);

            // Ensure valid URL
            if (!playerUrl.startsWith('http')) {
                if (playerUrl.startsWith('//')) {
                    playerUrl = 'https:' + playerUrl;
                } else {
                    continue;
                }
            }

            // ALWAYS use iframe for these streams - they are IP-locked
            // so m3u8 extraction doesn't work when proxied
            sources.push({
                id: `iframe-${i + 1}`,
                label: label,
                url: playerUrl,
                quality: "HD",
                type: "iframe",
            });
        }

        console.log(`[Scraper] Successfully found ${sources.length} streams for ${channelPath}`);
        if (sources.length === 0) { // Added back the if condition for correctness
            return NextResponse.json({
                error: "Could not extract any streams",
                hint: "Player pages may have changed structure"
            }, { status: 404 });
        }

        console.log(`[Scraper] Successfully extracted ${sources.length} streams for ${channelPath}`);

        // Update cache
        streamCache.set(channelPath, { sources, timestamp: Date.now() });

        return NextResponse.json({ sources, cached: false });

    } catch (error) {
        console.error("[Scraper] Error:", error);
        return NextResponse.json({ error: "Internal scraping error" }, { status: 500 });
    }
}

// Helper: Extract stream URL from a player page
async function extractStreamFromPlayer(playerUrl: string): Promise<string | null> {
    try {
        // Make sure it's a valid URL
        if (!playerUrl.startsWith('http')) {
            if (playerUrl.startsWith('//')) {
                playerUrl = 'https:' + playerUrl;
            } else {
                return null;
            }
        }

        const response = await fetch(playerUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Referer": "https://multicanaishd.best/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        });

        if (!response.ok) {
            console.log(`[Scraper] Player returned ${response.status}: ${playerUrl}`);
            return null;
        }

        const html = await response.text();

        // Look for m3u8 URLs in the player content
        // Multiple patterns to catch different player implementations
        const patterns = [
            /["']([^"']+\.m3u8[^"']*)['"]/gi,                    // Standard quoted .m3u8
            /source:\s*["']([^"']+\.m3u8[^"']*)['"]/gi,          // HLS.js source:
            /file:\s*["']([^"']+\.m3u8[^"']*)['"]/gi,            // JWPlayer file:
            /src:\s*["']([^"']+\.m3u8[^"']*)['"]/gi,             // Generic src:
            /url:\s*["']([^"']+\.m3u8[^"']*)['"]/gi,             // Generic url:
        ];

        for (const pattern of patterns) {
            const matches = [...html.matchAll(pattern)];
            if (matches.length > 0) {
                // Get first valid m3u8 URL
                for (const match of matches) {
                    let url = match[1];

                    // Clean up escaped characters
                    url = url.replace(/\\u002F/g, '/').replace(/\\/g, '');

                    // Skip data URIs and localhost
                    if (url.startsWith('data:') || url.includes('localhost')) continue;

                    // Validate it looks like a real URL
                    if (url.includes('.m3u8') && (url.startsWith('http') || url.startsWith('//'))) {
                        if (url.startsWith('//')) url = 'https:' + url;
                        console.log(`[Scraper] Extracted: ${url.substring(0, 80)}...`);
                        return url;
                    }
                }
            }
        }

        // If no direct m3u8, check for nested iframes
        const iframeRegex = /src=["']([^"']+(?:player|embed|watch)[^"']*)["']/gi;
        const iframeMatches = [...html.matchAll(iframeRegex)];

        for (const match of iframeMatches.slice(0, 2)) {
            let iframeUrl = match[1];
            if (iframeUrl.startsWith('//')) iframeUrl = 'https:' + iframeUrl;
            if (!iframeUrl.startsWith('http')) continue;

            console.log(`[Scraper] Following nested iframe: ${iframeUrl.substring(0, 80)}...`);
            const nestedStream = await extractStreamFromPlayer(iframeUrl);
            if (nestedStream) return nestedStream;
        }

        return null;

    } catch (error) {
        console.error(`[Scraper] Failed to extract from ${playerUrl}:`, error);
        return null;
    }
}
