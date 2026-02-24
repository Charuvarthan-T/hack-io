import sql from "@/lib/db";
export async function GET(){
    const n_courses = await sql`SELECT COUNT(*) FROM courses`;
    const n_users = await sql`SELECT COUNT(*) FROM users`;
    const n_problems = await sql`SELECT COUNT(*) FROM problems`;
    const n_semesters = await sql`SELECT COUNT(*) FROM semesters`;
    const n_sections = await sql`SELECT COUNT(*) FROM sections`;
    const n_instructors = await sql`SELECT COUNT(*) FROM users WHERE role = 'faculty'`;
    const n_departments = await sql`SELECT COUNT(*) FROM departments`;
    return new Response(JSON.stringify({
        n_courses: n_courses[0].count,
        n_users: n_users[0].count,
        n_problems: n_problems[0].count,
        n_semesters: n_semesters[0].count,
        n_sections: n_sections[0].count,
        n_instructors: n_instructors[0].count,
        n_departments: n_departments[0].count
    }), {status: 200});
}
