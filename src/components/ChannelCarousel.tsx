"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChannelCarouselProps {
    children: React.ReactNode;
    title: string;
}

export function ChannelCarousel({ children, title }: ChannelCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === "left" ? -400 : 400;
            current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    return (
        <div className="space-y-4">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between px-2">
                <h2 className="font-display text-2xl font-semibold text-white drop-shadow-md">
                    {title}
                </h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll("left")}
                        className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                        aria-label="Scroll Left"
                    >
                        <ChevronLeft className="h-5 w-5 text-white/70 transition-colors group-hover:text-white" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                        aria-label="Scroll Right"
                    >
                        <ChevronRight className="h-5 w-5 text-white/70 transition-colors group-hover:text-white" />
                    </button>
                </div>
            </div>

            {/* Scrollable Container */}
            <div className="group relative">
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-none mask-fade-right"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {children}
                </div>

                {/* Fade edges */}
                <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
            </div>
        </div>
    );
}
