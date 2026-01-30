import { HeroSection } from "@/components/HeroSection";
import { ChannelCard } from "@/components/ChannelCard";
import { ChannelCarousel } from "@/components/ChannelCarousel";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: channels } = await supabase.from('channels').select('*');

  return (
    <div className="min-h-screen pb-20">
      <HeroSection />

      {/* Channel Categories */}
      <div className="relative z-20 space-y-12 px-6 md:px-12 mt-4">

        {/* Section: Live Channels */}
        <section>
          <ChannelCarousel title="Canais Populares">
            {(channels || []).map((channel) => (
              <Link key={channel.id} href={`/watch/${channel.id}`}>
                <ChannelCard
                  name={channel.name}
                  category={channel.category}
                  viewers={channel.viewers}
                  image="/canais/bbb-16.png"
                />
              </Link>
            ))}
          </ChannelCarousel>
        </section>

        {/* Section: Movies Placeholder */}
        <section>
          <div className="flex items-center justify-between pb-6">
            <h2 className="font-display text-2xl font-semibold text-white">
              Filmes Recentes
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl border border-white/5 bg-white/5 transition-colors hover:bg-white/10" />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
