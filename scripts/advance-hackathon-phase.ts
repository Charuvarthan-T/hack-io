import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    const hackathonId = "95b87414-6ea0-4477-9322-f177810ab8b4";
    try {
        console.log(`Advancing hackathon ${hackathonId} to EVALUATION phase...`);
        
        const result = await sql`
            UPDATE hackathons 
            SET phase = 'EVALUATION' 
            WHERE id = ${hackathonId}
            RETURNING id, name, phase;
        `;
        
        if (result.length > 0) {
            console.log("✅ Success:", result[0]);
        } else {
            console.error("❌ Hackathon not found or update failed.");
        }

    } catch (error) {
        console.error("❌ Phase update failed:", error);
    }
}

main();
