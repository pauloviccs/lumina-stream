"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Image from "next/image";

interface ChannelCardProps {
    name: string;
    category: string;
    image: string;
    viewers: number;
    onClick?: () => void;
}

export function ChannelCard({ name, category, image, viewers, onClick }: ChannelCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative aspect-video flex-shrink-0 w-64 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/50 shadow-lg transition-all duration-500 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            onClick={onClick}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 z-10 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md ring-1 ring-white/50 shadow-lg">
                    <Play className="ml-1 h-5 w-5 fill-current" />
                </div>
            </div>

            {/* Gradient & Text */}
            <div className="absolute inset-0 z-30 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

            {/* Content Labels */}
            <div className="absolute top-2 right-2 z-40">
                <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-md border border-white/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white">{viewers.toLocaleString()}</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 z-40 w-full p-4 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
                <p className="text-xs font-medium text-indigo-300">{category}</p>
                <h3 className="text-lg font-bold text-white drop-shadow-md truncate">{name}</h3>
            </div>
        </motion.div>
    );
}
