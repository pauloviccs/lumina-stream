import { scrapeChannel } from "./src/lib/adapters/registry";

async function run() {
    console.log("Testing BBB (multicanaishd & redecanaistv)...");
    const bbb = await scrapeChannel("big-brother-brasil-26");
    console.log("BBB ScrapeResult:", JSON.stringify(bbb, null, 2));

    console.log("\\nTesting TNT Sports (redecanaistv)...");
    const tnt = await scrapeChannel("multishow");
    console.log("Multishow ScrapeResult:", JSON.stringify(tnt, null, 2));
}

run().catch(console.error);
