"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Hls from "hls.js";

interface VideoPlayerProps {
    src: string;
    poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
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
                maxBufferLength: 30,
                maxMaxBufferLength: 600,
                fragLoadingTimeOut: 20000,
                manifestLoadingTimeOut: 20000,
                xhrSetup: function (xhr, url) {
                    xhr.withCredentials = false;
                },
            });

            const proxyUrl = `/api/proxy?url=${encodeURIComponent(src)}`;
            hls.loadSource(proxyUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log("Manifest loaded, attempting play");
                // Auto-play is tricky with browsers, but we try
                if (isPlaying) video.play().catch(e => console.error("Play error:", e));
            });

            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls?.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls?.recoverMediaError();
                            break;
                        default:
                            hls?.destroy();
                            break;
                    }
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
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
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
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progress || 0);
        }
    };

    return (
        <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
            <video
                ref={videoRef}
                poster={poster}
                className="h-full w-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                muted={isMuted}
                playsInline
            />

            {/* Controls Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">

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

                        <button
                            onClick={() => {
                                const newMuted = !isMuted;
                                setIsMuted(newMuted);
                                if (videoRef.current) videoRef.current.muted = newMuted;
                            }}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        {/* Settings Menu */}
                        {showSettings && (
                            <div className="absolute bottom-full right-0 mb-4 w-32 overflow-hidden rounded-lg border border-white/10 bg-black/90 text-sm p-1 backdrop-blur-xl">
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
