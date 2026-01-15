import "dotenv/config";
import sql from "@/lib/db";

async function main() {
    const hackathonId = "e2817b30-b950-4738-9ac9-cb0d74ca017d"; // From user's log
    console.log(`Inspecting Hackathon: ${hackathonId}`);

    try {
        const result = await sql`SELECT id, title, status, start_date, end_date, created_at FROM hackathons WHERE id = ${hackathonId}`;
        console.log("Hackathon Data:", result[0]);

        if (result[0]) {
            console.log(`Status Check: Is ACTIVE? ${result[0].status === 'ACTIVE'}`);
        }
    } catch (error) {
        console.error("DB Error:", error);
    }
    process.exit(0);
}

main();
