import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Using Outfit for headings, Inter for body
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Lumina Stream",
  description: "Next-Gen Streaming Experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(
        "min-h-screen bg-background font-sans text-foreground antialiased",
        inter.variable,
        outfit.variable
      )}>
        <main className="relative flex min-h-screen flex-col overflow-hidden">
          {children}
        </main>

        {/* Footer - VICCS Lumia Streaming */}
        <footer className="relative z-50 border-t border-white/10 bg-black/50 backdrop-blur-xl py-6">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm text-white/60">
              © VICCS - Lumia Streaming® - 2026
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
