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

    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const addLog = (msg: string) => setDebugLogs(prev => [msg, ...prev].slice(0, 10));

    useEffect(() => {
        addLog(`Init Player: ${src}`);
        const video = videoRef.current;
        if (!video) return;

        let hls: Hls | null = null;
        const onError = (e: Event) => addLog(`Video Error: ${(e.target as HTMLVideoElement).error?.message}`);

        video.addEventListener('error', onError);

        if (Hls.isSupported() && src.endsWith('.m3u8')) {
            addLog("HLS Supported");
            hls = new Hls({
                // Simple config for TV
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90,
            });

            const shouldUseProxy = !src.includes('.online');
            const finalUrl = shouldUseProxy ? `/api/proxy?url=${encodeURIComponent(src)}` : src;

            addLog(`Loading: ${finalUrl.slice(0, 50)}...`);
            hls.loadSource(finalUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                addLog("Manifest Parsed");
                if (isPlaying) video.play().catch(e => addLog(`Play Fail: ${e.message}`));
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                addLog(`HLS Err: ${data.type} - ${data.details}`);
                if (data.fatal) {
                    hls?.destroy();
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            addLog("Native HLS");
            video.src = src;
        } else {
            addLog("Direct Src");
            video.src = src;
        }

        return () => {
            video.removeEventListener('error', onError);
            if (hls) hls.destroy();
        };
    }, [src]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().catch(e => addLog(`Play Err: ${e.message}`));
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(e => addLog(`FS Err: ${e}`));
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
            const val = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(val || 0);
        }
    };

    return (
        <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/20">
            {/* DEBUG OVERLAY FOR TV */}
            <div className="absolute top-0 left-0 bg-black/80 text-green-400 text-xs p-2 z-50 pointer-events-none font-mono max-h-40 overflow-hidden opacity-50">
                {debugLogs.map((l, i) => <div key={i}>{l}</div>)}
            </div>

            <video
                ref={videoRef}
                poster={poster}
                className="h-full w-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                muted={isMuted} // Muted is required for Autoplay in many browsers
                playsInline
                autoPlay // FORCE AUTOPLAY
            />

            {/* Simplied Controls for TV Performance */}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 to-transparent">
                {/* Progress Bar */}
                <div className="relative h-2 w-full bg-white/30 cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    if (videoRef.current) videoRef.current.currentTime = pos * videoRef.current.duration;
                }}>
                    <div
                        className="absolute h-full bg-indigo-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="p-2 bg-white/10 rounded-full hover:bg-white/20 focus:ring-2 focus:ring-white">
                            {isPlaying ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" fill="currentColor" />}
                        </button>
                        <button onClick={() => {
                            const newMuted = !isMuted;
                            setIsMuted(newMuted);
                            if (videoRef.current) videoRef.current.muted = newMuted;
                        }} className="text-white focus:text-indigo-400">
                            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </button>
                    </div>

                    {/* Right Settings */}
                    <div className="flex items-center gap-4">
                        <button onClick={toggleFullscreen} className="text-white focus:text-indigo-400">
                            <Maximize size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
