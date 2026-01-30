"use client";

import { motion } from "framer-motion";
import { Play, Info } from "lucide-react";

export function HeroSection() {
    return (
        <div className="relative h-[80vh] w-full overflow-hidden">
            {/* Background - Simulating a dynamic backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/50 via-gray-900 to-black" />

            {/* Background Image - BBB 26 Featured Thumbnail */}
            <div className="absolute inset-0 z-0 opacity-40 bg-[url('/canais/bbb-16.png')] bg-cover bg-center" />

            {/* Content Container with Liquid Glass Effect */}
            <div className="relative z-10 flex h-full flex-col justify-center px-6 md:px-12 lg:px-24">
                {/* Liquid Glass Container - iOS 26 Style */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative max-w-2xl space-y-6 rounded-3xl border border-white/5 bg-black/20 p-8 md:p-10 backdrop-blur-md shadow-xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 100%)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                >
                    {/* Subtle glass shine effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="relative font-display text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl drop-shadow-lg"
                    >
                        Big Brother <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-200 drop-shadow-lg">
                            Brasil 26
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative text-base text-white/80 md:text-lg leading-relaxed"
                    >
                        Acompanhe a casa mais vigiada do Brasil 24 horas por dia. Câmeras exclusivas, festas e tudo o que rola no reality.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative flex gap-4 pt-2"
                    >
                        <a
                            href="/watch/1fc929af-5820-4b1e-9cc7-e954fd5044cd"
                            className="flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur-sm px-8 py-4 font-bold text-black transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-lg active:scale-95"
                        >
                            <Play className="h-5 w-5 fill-current" />
                            Assistir Agora
                        </a>
                    </motion.div>
                </motion.div>
            </div>

            {/* Fade to content */}
            <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-background to-transparent" />
        </div>
    );
}
