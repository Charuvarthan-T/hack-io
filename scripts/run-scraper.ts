import "dotenv/config";
import { ScraperService } from "../lib/scraper.service";
async function main() {
    console.log("🚀 Starting live hackathon scraper...");
    try {
        console.log("--- Scraping Devpost ---");
        const devpost = await ScraperService.scrapeDevpost();
        console.log(`✅ Devpost: Found ${devpost.length} active hackathons.`);
        console.log("\n--- Scraping Unstop ---");
        const unstop = await ScraperService.scrapeUnstop();
        console.log(`✅ Unstop: Found ${unstop.length} active hackathons.`);
        console.log("\n✨ Scraping cycle completed successfully.");
    } catch (error) {
        console.error("❌ Scraping cycle failed:", error);
    }
    process.exit(0);
}
main();
