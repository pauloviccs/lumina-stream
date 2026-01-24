"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Image from "next/image";

interface ChannelCardProps {
    name: string;
    category: string;
    imageColor: string; // Temporary placement for image
    onClick?: () => void;
}

export function ChannelCard({ name, category, imageColor, onClick }: ChannelCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative aspect-video flex-shrink-0 w-64 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg transition-all duration-500 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            onClick={onClick}
        >
            {/* Background Layer - Image/Color */}
            <div
                className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110"
                style={{ background: imageColor }}
            >
                {/* Inner shadow/dim for contrast, fades slightly on hover */}
                <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/0" />
            </div>

            {/* Hover Overlay - Adds sheen without blurring text */}
            <div className="absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-white/5 backdrop-blur-[0px]" />

            {/* Play Overlay with Icon - Centered */}
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md ring-1 ring-white/50 shadow-lg">
                    <Play className="ml-1 h-5 w-5 fill-current" />
                </div>
            </div>

            {/* Gradient for text readability */}
            <div className="absolute inset-0 z-30 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/80" />

            {/* Text Content - Always on top */}
            <div className="absolute bottom-0 left-0 z-40 w-full p-4 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
                <p className="text-xs font-medium text-white/70">{category}</p>
                <h3 className="text-lg font-bold text-white drop-shadow-md">{name}</h3>
            </div>
        </motion.div>
    );
}
