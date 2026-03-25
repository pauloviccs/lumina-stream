import { NextRequest, NextResponse } from "next/server";
import { resolveChannelSlug, scrapeChannel } from "@/lib/adapters/registry";

/**
 * Channel Pushing v2 — Scrape Stream API
 * 
 * Usa o sistema de adapters para extrair fontes de transmissão.
 * Cada canal pode ter múltiplos adapters executados em paralelo.
 * Retorna status "online" ou "offline" de forma declarativa.
 */
export async function GET(request: NextRequest) {
    const channelParam = request.nextUrl.searchParams.get("channel");

    if (!channelParam) {
        return NextResponse.json({ error: "Missing channel parameter" }, { status: 400 });
    }

    // Resolver slug → ID padronizado do registry
    const channelSlug = resolveChannelSlug(channelParam);

    if (!channelSlug) {
        return NextResponse.json({ error: "Unknown channel" }, { status: 404 });
    }

    try {
        console.log(`[Scraper API] Request for channel: ${channelParam} → ${channelSlug}`);

        const result = await scrapeChannel(channelSlug);

        console.log(`[Scraper API] Result: ${result.sources.length} sources, status: ${result.status}, adapters: ${result.adaptersUsed.join(", ") || "none"}`);

        if (result.adaptersFailed.length > 0) {
            console.warn(`[Scraper API] Failed adapters: ${result.adaptersFailed.join(", ")}`);
        }

        // Sempre retorna 200 — o frontend lida com status online/offline
        return NextResponse.json({
            sources: result.sources,
            status: result.status,
            cached: result.cached,
            adaptersUsed: result.adaptersUsed,
            adaptersFailed: result.adaptersFailed,
        });

    } catch (error) {
        console.error("[Scraper API] Unexpected error:", error);
        return NextResponse.json({
            sources: [],
            status: "offline",
            cached: false,
            adaptersUsed: [],
            adaptersFailed: [],
            error: "Internal scraping error",
        }, { status: 500 });
    }
}
