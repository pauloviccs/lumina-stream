import { createClient } from "@/utils/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StreamSelector } from "./StreamSelector";
import { resolveChannelSlug } from "@/lib/adapters/registry";

// Force dynamic rendering to always get fresh streams
export const dynamic = 'force-dynamic';

// Helper: Fetch dynamic streams from scraper API
async function fetchDynamicStreams(channelSlug: string, baseUrl: string) {
    try {
        const response = await fetch(`${baseUrl}/api/scrape-stream?channel=${encodeURIComponent(channelSlug)}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`[WatchPage] Scraper returned ${response.status}`);
            return { sources: [], status: "offline" as const };
        }

        const data = await response.json();
        return {
            sources: data.sources || [],
            status: (data.status || (data.sources?.length > 0 ? "online" : "offline")) as "online" | "offline",
        };
    } catch (error) {
        console.error("[WatchPage] Failed to fetch dynamic streams:", error);
        return { sources: [], status: "offline" as const };
    }
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Buscar dados do canal no Supabase (nome, logo, categoria — NÃO fontes)
    const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .eq('id', id)
        .single();

    if (!channel) {
        return <div className="p-12 text-white">Canal não encontrado.</div>;
    }

    // Verificar se o canal suporta scraping dinâmico
    const scrapableSlug = resolveChannelSlug(channel.name);

    let sources: any[] = [];
    let isOffline = false;

    if (scrapableSlug) {
        console.log(`[WatchPage] Channel "${channel.name}" supports scraping → ${scrapableSlug}`);

        const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000';

        console.log(`[WatchPage] Using baseUrl: ${baseUrl}`);

        const result = await fetchDynamicStreams(scrapableSlug, baseUrl);
        sources = result.sources;
        isOffline = result.status === "offline";

        if (isOffline) {
            console.warn(`[WatchPage] All adapters offline for "${channel.name}"`);
        } else {
            console.log(`[WatchPage] ${sources.length} sources loaded for "${channel.name}"`);
        }
    } else {
        // Canal sem scraping — marcar como offline (sem fallback Supabase)
        isOffline = true;
    }

    // Ordenar: "Câmera" primeiro, depois alfabético
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

            {/* StreamSelector recebe isOffline para decidir entre player ou tela offline */}
            <StreamSelector sources={sources} channelName={channel.name} isOffline={isOffline} />
        </div>
    );
}
