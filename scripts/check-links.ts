import "dotenv/config";
import sql from "../lib/db";
async function checkLinks() {
    console.log("Checking external hackathon links in DB...");
    const results = await sql`SELECT id, title, external_url, source FROM external_hackathons LIMIT 10`;
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
}
checkLinks();
