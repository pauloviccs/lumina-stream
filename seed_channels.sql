-- Seed: Inserir novos canais no Lumina Stream
-- Executar no SQL Editor do Supabase Dashboard

INSERT INTO channels (name, category, logo_url, image_color, is_featured)
SELECT * FROM (VALUES 
    ('Paramount+ Plus', 'Streaming', '/canais/paramount-plus.png', '#0064FF', false),
    ('Globo', 'TV Aberta', '/canais/globo.png', '#E21B1B', true),
    ('Multishow', 'Entretenimento', '/canais/multishow.png', '#FF6B00', false),
    ('HBO', 'Filmes & Séries', '/canais/hbo.png', '#7B2D8E', true),
    ('ESPN', 'Esportes', '/canais/espn.png', '#CC0000', false),
    ('SporTV', 'Esportes', '/canais/sportv.png', '#00A859', false),
    ('KBS World TV', 'Internacional', '/canais/kbsworldtv.png', '#1A1A2E', false)
) AS t(name, category, logo_url, image_color, is_featured)
WHERE NOT EXISTS (
    SELECT 1 FROM channels c WHERE c.name = t.name
);
-- Verificar inserções:
SELECT id, name, category, logo_url FROM channels ORDER BY name;
