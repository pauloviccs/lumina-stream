import { createClient } from "@/utils/supabase/server";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ArrowLeft, PlayCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
// Client component for source selection
import { StreamSelector } from "./StreamSelector";

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

    // Sort sources: "Câmera" first (natural sort), then alphabetical
    sources.sort((a, b) => {
        const isCameraA = a.label.startsWith('Câmera');
        const isCameraB = b.label.startsWith('Câmera');

        if (isCameraA && !isCameraB) return -1;
        if (!isCameraA && isCameraB) return 1;

        return a.label.localeCompare(b.label, undefined, { numeric: true });
    });



    if (!channel) {
        return <div className="p-12 text-white">Canal não encontrado.</div>;
    }

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
