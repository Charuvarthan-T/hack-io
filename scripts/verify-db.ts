import "dotenv/config";
import sql from "../lib/db";
async function check() {
    try {
        const columns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'problems_users';
        `;
        console.log("Columns in 'problems_users':", columns);
        const testQuery = await sql`
            SELECT
                p.id,
                p.difficulty,
                ARRAY_AGG(t.name) as tags,
                pu.updated_at as solved_at
            FROM problems p
            JOIN problems_users pu ON p.id = pu.problemid
            LEFT JOIN problems_tags pt ON p.id = pt.problem_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE pu.is_completed = 'solved'
            GROUP BY p.id, pu.updated_at
            LIMIT 1
        `;
        console.log("Test query result:", testQuery);
    } catch (error) {
        console.error("Column check failed:", error);
    }
    process.exit(0);
}
check();
