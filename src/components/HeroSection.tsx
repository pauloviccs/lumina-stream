"use client";

import { motion } from "framer-motion";
import { Play, Info } from "lucide-react";

export function HeroSection() {
    return (
        <div className="relative h-[80vh] w-full overflow-hidden">
            {/* Background - Simulating a dynamic backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/50 via-gray-900 to-black" />

            {/* Content Container */}
            <div className="relative z-10 flex h-full flex-col justify-center px-12 md:px-24">
                <div className="max-w-2xl space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="font-display text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl lg:text-8xl"
                    >
                        Globo News <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                            Edição das 18h
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-lg text-white/60 md:text-xl"
                    >
                        Acompanhe as principais notícias do Brasil e do mundo com cobertura em tempo real e análises exclusivas.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex gap-4 pt-4"
                    >
                        <button className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-black transition-transform hover:scale-105 active:scale-95">
                            <Play className="h-5 w-5 fill-current" />
                            Assistir Agora
                        </button>
                        <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white backdrop-blur-md transition-colors hover:bg-white/10">
                            <Info className="h-5 w-5" />
                            Mais Detalhes
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Fade to content */}
            <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-background to-transparent" />
        </div>
    );
}
