"use client";

import { useState } from "react";
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
    const [isTheaterMode, setIsTheaterMode] = useState(false);

    if (!selectedSource) {
        return <div className="text-white/50">Nenhuma fonte disponível.</div>;
    }

    const toggleTheaterMode = () => {
        setIsTheaterMode((prev) => !prev);
    };

    return (
        <div className={cn(
            "grid gap-8 transition-all duration-500 ease-in-out",
            isTheaterMode
                ? "grid-cols-1"
                : "grid-cols-1 lg:grid-cols-3"
        )}>
            {/* Main Content (Player) */}
            <div className={cn(
                "space-y-6 transition-all duration-500 ease-in-out",
                isTheaterMode ? "col-span-1" : "lg:col-span-2"
            )}>
                <VideoPlayer
                    src={selectedSource.url}
                    isTheaterMode={isTheaterMode}
                    onTheaterModeToggle={toggleTheaterMode}
                />

                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                            <PlayCircle size={20} />
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-white">Assistindo: {selectedSource.label}</p>
                            <p className="text-white/40">Qualidade: {selectedSource.quality}</p>
                        </div>
                    </div>

                    <button className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all">
                        <AlertTriangle size={14} />
                        Reportar Erro
                    </button>
                </div>
            </div>

            {/* Sidebar (Sources) - Moves below player in theater mode */}
            <div className={cn(
                "rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl",
                "transition-all duration-500 ease-in-out",
                isTheaterMode ? "h-fit order-last" : "h-fit"
            )}>
                <h3 className="mb-4 font-display text-lg font-bold text-white">Fontes de Transmissão</h3>

                <div className={cn(
                    "grid gap-3 transition-all duration-500",
                    isTheaterMode
                        ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9"
                        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-2"
                )}>
                    {sources.map((source) => (
                        <button
                            key={source.id}
                            onClick={() => setSelectedSource(source)}
                            onPointerUp={() => setSelectedSource(source)}
                            className={cn(
                                "relative flex flex-col items-center justify-center rounded-xl p-4 transition-all duration-300",
                                selectedSource.id === source.id
                                    ? "bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)] ring-1 ring-white/50 scale-105 z-10"
                                    : "bg-white/5 hover:bg-white/10 hover:scale-[1.02]"
                            )}
                        >
                            <span className={cn(
                                "mb-1 text-sm font-bold text-center",
                                selectedSource.id === source.id ? "text-white" : "text-white/70"
                            )}>
                                {source.label}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-white/40 bg-black/30 px-2 py-0.5 rounded-full">
                                {source.quality}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
