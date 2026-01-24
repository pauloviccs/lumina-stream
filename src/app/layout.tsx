import "core-js/stable";
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
      <head>
        {/* Global Error Trap for TV Debugging */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
                window.onerror = function(msg, url, line, col, error) {
                   var d = document.createElement('div');
                   d.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:rgba(200,0,0,0.9);color:white;z-index:9999;font-size:20px;padding:20px;pointer-events:none;white-space:pre-wrap;';
                   d.innerHTML = 'FATAL JS ERROR:\\n' + msg + '\\nLine: ' + line + ':' + col;
                   document.documentElement.appendChild(d);
                   return false;
                };
                
                // Polyfill Check
                if (typeof ResizeObserver === 'undefined') {
                  document.write('<script src="https://unpkg.com/resize-observer-polyfill@1.5.1/dist/ResizeObserver.global.js"><\\/script>');
                }
              `
          }}
        />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-sans text-foreground antialiased",
        inter.variable,
        outfit.variable
      )}>
        <main className="relative flex min-h-screen flex-col overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
