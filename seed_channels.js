const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://giihzdpgrariyvtqofzi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaWh6ZHBncmFyaXl2dHFvZnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzQyMTgsImV4cCI6MjA4NDg1MDIxOH0.MFcbWgSe7S9p5H-py6PijoDKGtwxJmBYPlo_L0UD9oU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const NEW_CHANNELS = [
    {
        name: "Paramount+ Plus",
        category: "Streaming",
        logo_url: "/canais/paramount-plus.png",
        image_color: "#0064FF",
        is_featured: false,
    },
    {
        name: "Globo",
        category: "TV Aberta",
        logo_url: "/canais/globo.png",
        image_color: "#E21B1B",
        is_featured: true,
    },
    {
        name: "Multishow",
        category: "Entretenimento",
        logo_url: "/canais/multishow.png",
        image_color: "#FF6B00",
        is_featured: false,
    },
    {
        name: "HBO",
        category: "Filmes & Séries",
        logo_url: "/canais/hbo.png",
        image_color: "#7B2D8E",
        is_featured: true,
    },
    {
        name: "ESPN",
        category: "Esportes",
        logo_url: "/canais/espn.png",
        image_color: "#CC0000",
        is_featured: false,
    },
    {
        name: "SporTV",
        category: "Esportes",
        logo_url: "/canais/sportv.png",
        image_color: "#00A859",
        is_featured: false,
    },
    {
        name: "KBS World TV",
        category: "Internacional",
        logo_url: "/canais/kbsworldtv.png",
        image_color: "#1A1A2E",
        is_featured: false,
    },
];

async function run() {
    console.log('Inserting new channels...\n');

    for (const channel of NEW_CHANNELS) {
        // Check if already exists
        const { data: existing } = await supabase
            .from('channels')
            .select('id, name')
            .ilike('name', channel.name)
            .limit(1);

        if (existing && existing.length > 0) {
            console.log(`⏭ "${channel.name}" already exists (${existing[0].id})`);
            continue;
        }

        const { data, error } = await supabase
            .from('channels')
            .insert(channel)
            .select('id, name')
            .single();

        if (error) {
            console.error(`✗ Failed to insert "${channel.name}":`, error.message);
        } else {
            console.log(`✓ Inserted "${data.name}" → ${data.id}`);
        }
    }

    console.log('\nDone! Listing all channels:');
    const { data: all } = await supabase.from('channels').select('id, name, category').order('name');
    if (all) {
        all.forEach(c => console.log(`  ${c.name} (${c.category}) → ${c.id}`));
    }
}

run().catch(console.error);
