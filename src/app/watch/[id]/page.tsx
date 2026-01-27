import { createClient } from "@/utils/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
// Client component for source selection
import { StreamSelector } from "./StreamSelector";

// Force dynamic rendering to always get fresh streams
export const dynamic = 'force-dynamic';

// Channels that support dynamic scraping
const SCRAPE_SUPPORTED_CHANNELS: Record<string, string> = {
    "big-brother-brasil-26": "big-brother-brasil-26",
    "big brother brasil 26": "big-brother-brasil-26",
    "big brother brasil": "big-brother-brasil-26",
    "bbb 26": "big-brother-brasil-26",
    "bbb26": "big-brother-brasil-26",
    // Add more as needed
};

// Helper: Check if channel name matches a scrapeable channel
function getScrapableSlug(channelName: string): string | null {
    const normalized = channelName.toLowerCase().trim();

    // Direct match
    if (SCRAPE_SUPPORTED_CHANNELS[normalized]) {
        return SCRAPE_SUPPORTED_CHANNELS[normalized];
    }

    // Partial match
    for (const [key, value] of Object.entries(SCRAPE_SUPPORTED_CHANNELS)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    return null;
}

// Helper: Fetch dynamic streams from scraper API
async function fetchDynamicStreams(channelSlug: string, baseUrl: string): Promise<any[]> {
    try {
        const response = await fetch(`${baseUrl}/api/scrape-stream?channel=${encodeURIComponent(channelSlug)}`, {
            cache: 'no-store', // Always fresh
        });

        if (!response.ok) {
            console.error(`[WatchPage] Scraper returned ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data.sources || [];
    } catch (error) {
        console.error("[WatchPage] Failed to fetch dynamic streams:", error);
        return [];
    }
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Parallel fetch for channel and sources
    const [channelRes, sourcesRes] = await Promise.all([
        supabase.from('channels').select('*').eq('id', id).single(),
        supabase.from('stream_sources').select('*').eq('channel_id', id)
    ]);

    const channel = channelRes.data;
    let sources = sourcesRes.data || [];

    if (!channel) {
        return <div className="p-12 text-white">Canal não encontrado.</div>;
    }

    // Check if this channel supports dynamic scraping
    const scrapableSlug = getScrapableSlug(channel.name);

    if (scrapableSlug) {
        console.log(`[WatchPage] Channel "${channel.name}" supports scraping, fetching dynamic streams...`);

        // Get the base URL for internal API calls
        // Priority: Production URL > Preview URL > localhost
        const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000';

        console.log(`[WatchPage] Using baseUrl: ${baseUrl}`);

        const dynamicSources = await fetchDynamicStreams(scrapableSlug, baseUrl);

        if (dynamicSources.length > 0) {
            console.log(`[WatchPage] Using ${dynamicSources.length} dynamic streams`);
            sources = dynamicSources;
        } else {
            console.warn(`[WatchPage] No dynamic streams found, falling back to Supabase sources`);
        }
    }

    // Sort sources: "Câmera" first (natural sort), then alphabetical
    sources.sort((a: any, b: any) => {
        const isCameraA = a.label?.startsWith('Câmera') || false;
        const isCameraB = b.label?.startsWith('Câmera') || false;

        if (isCameraA && !isCameraB) return -1;
        if (!isCameraA && isCameraB) return 1;

        return (a.label || '').localeCompare(b.label || '', undefined, { numeric: true });
    });

    return (
        <div className="min-h-screen p-6 md:p-12">
            {/* Header */}
            <header className="mb-8 flex items-center gap-4">
                <Link
                    href="/"
                    className="flex items-center justify-center rounded-full bg-white/5 p-3 text-white backdrop-blur-md transition-all hover:bg-white/10 hover:scale-105"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="font-display text-3xl font-bold text-white">{channel.name}</h1>
                    <p className="text-white/50">Ao Vivo • {channel.category}</p>
                </div>
            </header>

            {/* We pass the sources to a client component because managing selected source state happens on the client */}
            <StreamSelector sources={sources} channelName={channel.name} />
        </div>
    );
}
