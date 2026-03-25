"use client";

import { useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { PlayCircle, AlertTriangle, WifiOff, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Source {
    id: string;
    label: string;
    url: string;
    quality: string;
    type?: "m3u8" | "iframe";
    referer?: string;
    adapterId?: string;
}

interface StreamSelectorProps {
    sources: Source[];
    channelName: string;
    isOffline?: boolean;
}

// ─── Offline State ──────────────────────────────────────────
function OfflineState({ channelName }: { channelName: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/30 px-8 py-20 backdrop-blur-xl"
        >
            <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-400"
            >
                <WifiOff size={36} />
            </motion.div>
            <h2 className="mb-2 font-display text-2xl font-bold text-white">
                Transmissões Offline
            </h2>
            <p className="max-w-md text-center text-white/50">
                As fontes de transmissão de <span className="text-white/70 font-medium">{channelName}</span> estão
                temporariamente indisponíveis. Tente novamente em alguns minutos.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="mt-8 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 min-h-[44px]"
            >
                Tentar Novamente
            </button>
        </motion.div>
    );
}

// ─── Loading State (Pulsing) ────────────────────────────────
function LoadingState() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/30 px-8 py-20 backdrop-blur-xl"
        >
            <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400"
            >
                <Radio size={28} />
            </motion.div>
            <p className="font-display text-lg font-bold text-white/80">
                Puxando Sinal HD...
            </p>
            {/* Skeleton pulsante */}
            <div className="mt-6 flex gap-3">
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                        className="h-12 w-24 rounded-xl bg-white/5"
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ─── Main Component ─────────────────────────────────────────
export function StreamSelector({ sources, channelName, isOffline = false }: StreamSelectorProps) {
    const [selectedSource, setSelectedSource] = useState<Source | null>(sources[0] || null);
    const [isTheaterMode, setIsTheaterMode] = useState(false);

    // Offline: nenhuma fonte disponível
    if (isOffline && sources.length === 0) {
        return <OfflineState channelName={channelName} />;
    }

    // Sem fonte selecionada (edge case)
    if (!selectedSource) {
        return <LoadingState />;
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
                {/* Player com Framer Motion fade-in na troca de fonte */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedSource.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        {selectedSource.type === "iframe" ? (
                            <div className={cn(
                                "aspect-video w-full rounded-2xl overflow-hidden bg-black/80",
                                isTheaterMode ? "h-[70vh]" : ""
                            )}>
                                <iframe
                                    src={selectedSource.url}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        ) : (
                            <VideoPlayer
                                src={selectedSource.url}
                                referer={selectedSource.referer}
                                isTheaterMode={isTheaterMode}
                                onTheaterModeToggle={toggleTheaterMode}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Info bar */}
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                            <PlayCircle size={20} />
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-white">Assistindo: {selectedSource.label}</p>
                            <p className="text-white/40">
                                Qualidade: {selectedSource.quality}
                                {selectedSource.adapterId && (
                                    <span className="ml-2 text-white/20">• {selectedSource.adapterId}</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <button className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all min-h-[44px]">
                        <AlertTriangle size={14} />
                        Reportar Erro
                    </button>
                </div>
            </div>

            {/* Sidebar (Sources) */}
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
                                // ─── Touch target mínimo de 44px ───
                                "min-h-[44px] min-w-[44px]",
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
