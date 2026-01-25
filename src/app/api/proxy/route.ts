import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    const refererParam = request.nextUrl.searchParams.get("referer");

    if (!url) {
        return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    try {
        const headers: HeadersInit = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
        };

        // SMART REFERER STRATEGY
        // 1. Use provided 'referer' param if available
        // 2. Fallback to the target URL's origin (self-referencing), which mimics direct navigation and often works
        let referer = refererParam;
        if (!referer) {
            try {
                referer = new URL(url).origin + "/";
            } catch (e) {
                referer = "https://multicanaishd.best/";
            }
        }

        headers["Referer"] = referer;
        headers["Origin"] = new URL(referer).origin;

        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error(`Upstream Fetch failed: ${response.status} ${response.statusText} for ${url}`);
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

                // Wrap in proxy
                return `${request.nextUrl.origin}/api/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(headers["Referer"] as string)}`;
            }).join('\n');

            body = text;
        } else {
            // Binary pass-through for Video Segments (ts) and others
            body = response.body as any; // Cast to any to satisfy TS for ReadableStream
        }

        const responseHeaders = new Headers();
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Content-Type", contentType);
        responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

        // Forward important headers for streaming/seeking
        // NOTE: We do NOT forward Content-Length because fetch() may decompress the body,
        // causing a mismatch with the upstream header. Chunked transfer is safer.
        const contentRange = response.headers.get("Content-Range");
        if (contentRange) responseHeaders.set("Content-Range", contentRange);

        return new NextResponse(body, {
            status: 200,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
