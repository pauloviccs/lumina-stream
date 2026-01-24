"use client";

import { useState, useEffect } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { PlayCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
    id: string;
    label: string;
    url: string;
    quality: string;
}

interface SourceSelectorProps {
    sources: Source[];
    channelName: string;
}

export function StreamSelector({ sources, channelName }: SourceSelectorProps) {
    const [selectedSource, setSelectedSource] = useState<Source | null>(sources[0] || null);

    // Heartbeat to verify React Hydration
    const [alive, setAlive] = useState(false);
    useEffect(() => {
        const interval = setInterval(() => setAlive(v => !v), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!selectedSource) {
        return <div className="text-white/50">Nenhuma fonte disponível.</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 pb-10">
            {/* React Life Indicator */}
            <div className={`fixed top-4 right-4 w-4 h-4 rounded-full z-50 ${alive ? 'bg-green-500' : 'bg-red-500'}`} style={{ boxShadow: '0 0 10px currentColor' }} />

            {/* Main Content (Player) */}
            <div className="flex-1 space-y-4">
                <VideoPlayer src={selectedSource.url} />

                {/* Info Bar - Solid Background for TV Performance */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-stone-900 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-900 text-green-400">
                            <PlayCircle size={20} />
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-white">Assistindo: {selectedSource.label}</p>
                            <p className="text-white/50">Qualidade: {selectedSource.quality}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar (Sources) */}
            <div className="w-full lg:w-80 h-fit rounded-2xl border border-white/10 bg-stone-900 p-6">
                <h3 className="mb-4 text-lg font-bold text-white">Câmeras / Fontes</h3>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    {sources.map((source) => (
                        <button
                            key={source.id}
                            /* TV Remotes often trigger Pointer/Touch events differently than Mouse clicks */
                            onClick={() => setSelectedSource(source)}
                            onPointerUp={() => setSelectedSource(source)}
                            onTouchEnd={() => setSelectedSource(source)} // LG Magic Remote sometimes uses touch
                            className={cn(
                                "flex flex-col items-start justify-center rounded-lg p-3 transition-colors border-2 cursor-pointer active:scale-95",
                                selectedSource.id === source.id
                                    ? "bg-indigo-900 border-indigo-500 text-white"
                                    : "bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:border-white/30"
                            )}
                        >
                            <span className="text-sm font-bold">{source.label}</span>
                            <span className="text-[10px] uppercase opacity-60">{source.quality}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
