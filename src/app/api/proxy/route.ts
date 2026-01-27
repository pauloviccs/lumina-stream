import { NextRequest, NextResponse } from "next/server";

// Map of known stream domains to their required referers
const REFERER_MAP: Record<string, string> = {
    // embedtvonline streams
    "vipcanaisplay.site": "https://embedtvonline.com/",

    // rdcanais.top streams (uses imgcontent.xyz CDN)
    "imgcontent.xyz": "https://rdcanais.top/",
    "image-storage": "https://rdcanais.top/",

    // nossoplayeronlinehd streams
    "nossoplayeronlinehd": "https://nossoplayeronlinehd.online/",

    // meuplayeronlinehd streams
    "meuplayeronlinehd": "https://meuplayeronlinehd.com/",

    // redecanaistv streams
    "redecanaistv": "https://redecanaistv.fm/",

    // Default fallback
    "cloudfront-net.online": "https://multicanaishd.best/",
    "default": "https://multicanaishd.best/",
};

// Get the best referer for a given URL
function getRefererForUrl(url: string): string {
    try {
        const hostname = new URL(url).hostname.toLowerCase();

        for (const [domain, referer] of Object.entries(REFERER_MAP)) {
            if (hostname.includes(domain)) {
                return referer;
            }
        }
    } catch (e) {
        // Fall through to default
    }
    return REFERER_MAP["default"];
}

export async function GET(request: NextRequest) {
    let url = request.nextUrl.searchParams.get("url");
    const refererParam = request.nextUrl.searchParams.get("referer");

    if (url) url = url.trim();

    if (!url) {
        return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    try {
        // Use passed referer or determine from URL
        const referer = refererParam || getRefererForUrl(url);

        const headers: HeadersInit = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": referer,
            "Origin": new URL(referer).origin,
        };

        console.log(`[Proxy] Fetching ${url.substring(0, 80)}... with Referer: ${referer}`);

        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error(`[Proxy] Upstream failed: ${response.status} ${response.statusText} for ${url}`);
            return NextResponse.json(
                { error: `Failed to fetch source: ${response.statusText}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("Content-Type") || "application/octet-stream";
        const isManifest = url.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

        let body: BodyInit;

        if (isManifest) {
            // Text processing for Manifests
            let text = await response.text();

            const baseUrl = new URL(url);
            const basePath = baseUrl.href.substring(0, baseUrl.href.lastIndexOf('/') + 1);

            // Replace each line that is a URI (not starting with #)
            text = text.split('\n').map(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return line;

                // Resolve absolute URL
                let absoluteUrl = trimmed;
                if (!trimmed.startsWith('http')) {
                    absoluteUrl = new URL(trimmed, basePath).href;
                }

                // Wrap in proxy, passing the current referer for consistency
                return `${request.nextUrl.origin}/api/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
            }).join('\n');

            body = text;
        } else {
            // Binary pass-through for Video Segments (ts) and others
            body = response.body as any;
        }

        const responseHeaders = new Headers();
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Content-Type", contentType);
        responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

        // Forward important headers for streaming/seeking
        const contentRange = response.headers.get("Content-Range");
        if (contentRange) responseHeaders.set("Content-Range", contentRange);

        return new NextResponse(body, {
            status: 200,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error("[Proxy] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
