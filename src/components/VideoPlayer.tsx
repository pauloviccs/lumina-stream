"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RectangleHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import Hls from "hls.js";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    isTheaterMode?: boolean;
    onTheaterModeToggle?: () => void;
}

export function VideoPlayer({ src, poster, isTheaterMode, onTheaterModeToggle }: VideoPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls: Hls | null = null;

        if (Hls.isSupported() && src.endsWith('.m3u8')) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90,
            });

            // Use proxy for all external HLS streams to ensure consistent IP
            // (scraping generates tokens for Vercel's IP, so proxy works correctly)
            const cleanSrc = src.trim();
            const isExternal = cleanSrc.startsWith('http');
            const finalUrl = isExternal ? `/api/proxy?url=${encodeURIComponent(cleanSrc)}` : cleanSrc;

            console.log('[VideoPlayer] Loading stream via proxy');

            hls.loadSource(finalUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isPlaying) video.play().catch(e => console.error("Play error:", e));
            });

            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    if (hls) hls.destroy();
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
        } else {
            video.src = src;
        }

        return () => {
            if (hls) hls.destroy();
        };
    }, [src]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            // Support for mobile fullscreen
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if ((videoRef.current as any).webkitEnterFullscreen) {
                // iOS Polyfillish
                (videoRef.current as any).webkitEnterFullscreen();
            }
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    const changePlaybackRate = (rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
            setShowSettings(false);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && videoRef.current.duration) {
            const val = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(val || 0);
        }
    };

    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleUserActivity = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    useEffect(() => {
        handleUserActivity();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [isPlaying]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10",
                !showControls && isPlaying ? "cursor-none" : "cursor-default"
            )}
            onMouseMove={handleUserActivity}
            onClick={handleUserActivity}
            onMouseLeave={() => {
                if (isPlaying) setShowControls(false);
            }}
        >
            <video
                ref={videoRef}
                poster={poster}
                className="h-full w-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                muted={isMuted} // Muted required for Autoplay
                playsInline
                autoPlay // FORCE AUTOPLAY
            />

            {/* Controls Overlay - Glassmorphism Restored */}
            <div className={cn(
                "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>

                {/* Progress Bar */}
                <div className="relative h-1 w-full bg-white/20 cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    if (videoRef.current) videoRef.current.currentTime = pos * videoRef.current.duration;
                }}>
                    <div
                        className="absolute h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={togglePlay}
                            className="rounded-full bg-white/10 p-2 text-white backdrop-blur-md hover:bg-white/20 transition-all active:scale-95"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                        </button>

                        <div className="flex items-center gap-2 group/volume">
                            <button onClick={() => {
                                const newMuted = !isMuted;
                                setIsMuted(newMuted);
                                if (videoRef.current) videoRef.current.muted = newMuted;
                            }} className="text-white focus:text-indigo-400">
                                {isMuted || (videoRef.current?.volume === 0) ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                defaultValue="1"
                                onChange={(e) => {
                                    const vol = parseFloat(e.target.value);
                                    if (videoRef.current) {
                                        videoRef.current.volume = vol;
                                        videoRef.current.muted = vol === 0;
                                        setIsMuted(vol === 0);
                                    }
                                }}
                                className="w-0 overflow-hidden transition-all duration-300 group-hover/volume:w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        {/* Settings Menu */}
                        {showSettings && (
                            <div className="absolute bottom-full right-0 mb-4 w-32 overflow-hidden rounded-lg border border-white/10 bg-black/80 text-sm p-1 backdrop-blur-xl">
                                <div className="px-2 py-1 text-xs text-white/50 font-bold uppercase tracking-wider">Speed</div>
                                {[0.5, 1, 1.5, 2].map(rate => (
                                    <button
                                        key={rate}
                                        onClick={() => changePlaybackRate(rate)}
                                        className={cn(
                                            "w-full px-2 py-1.5 text-left rounded-md transition-colors",
                                            playbackRate === rate ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"
                                        )}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <Settings size={20} className={cn("transition-transform duration-500", showSettings && "rotate-90")} />
                        </button>

                        {/* Theater Mode Button */}
                        {onTheaterModeToggle && (
                            <button
                                onClick={onTheaterModeToggle}
                                className={cn(
                                    "transition-colors",
                                    isTheaterMode ? "text-indigo-400" : "text-white/70 hover:text-white"
                                )}
                                title={isTheaterMode ? "Sair do Modo Teatro" : "Modo Teatro"}
                                aria-label={isTheaterMode ? "Sair do Modo Teatro" : "Ativar Modo Teatro"}
                            >
                                <RectangleHorizontal size={20} />
                            </button>
                        )}

                        <button
                            onClick={toggleFullscreen}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <Maximize size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
