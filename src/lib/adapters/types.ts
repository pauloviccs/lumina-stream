/**
 * Channel Pushing v2 — Adapter Types
 * 
 * Define o contrato de cada adapter de scraping e o formato
 * padronizado de fontes de transmissão.
 */

/** Fonte de transmissão extraída de um adapter */
export interface StreamSource {
    id: string;
    label: string;
    url: string;
    quality: string;
    type: "m3u8" | "iframe";
    /** Referer necessário para o proxy CORS — declarativo */
    referer?: string;
    /** ID do adapter que gerou esta fonte */
    adapterId?: string;
}

/** Resultado completo de uma operação de scraping */
export interface ScrapeResult {
    sources: StreamSource[];
    /** Status geral: online se pelo menos 1 fonte encontrada */
    status: "online" | "offline";
    cached: boolean;
    /** IDs dos adapters que foram tentados */
    adaptersUsed: string[];
    /** IDs dos adapters que falharam */
    adaptersFailed: string[];
}

/** Contrato que todo adapter de canal implementa */
export interface ChannelAdapter {
    /** ID único do adapter (ex: "multicanaishd") */
    id: string;
    /** Nome legível (ex: "MultiCanais HD") */
    name: string;
    /** URL base do site fonte */
    baseUrl: string;
    /** Status operacional do adapter */
    status: "active" | "blocked" | "deprecated";

    /** Constrói a URL final para scraping dado o path do canal */
    buildUrl(channelPath: string): string;

    /** Extrai fontes de transmissão do HTML bruto */
    parseHtml(html: string, channelPath: string): StreamSource[];

    /** Headers HTTP para o fetch (User-Agent, Referer, etc.) */
    getHeaders(): HeadersInit;

    /**
     * Mapeamento de channel path específico deste adapter.
     * Ex: multicanaishd usa "big-brother-brasil-26",
     *     redecanaistv usa "bbb-26-5"
     */
    getChannelPath(registryPath: string): string;
}

/** Entrada no registro de canais */
export interface ChannelRegistryEntry {
    /** Paths que cada adapter usa para este canal */
    channelPaths: Record<string, string>;
    /** IDs dos adapters a serem usados, em ordem de prioridade */
    adapters: string[];
}
