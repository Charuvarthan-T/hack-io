import { requireAuth } from "@/lib/auth-helpers";
import sql from "@/lib/db";
import { SkillTrackerService, SKILL_TAXONOMY } from "@/lib/skill-tracker.service";
import { NextResponse } from "next/server";
export async function GET() {
    try {
        const user = await requireAuth();
        if ("json" in user) return user;
        if (user.role !== 'student' && user.role !== 'admin') {
            return NextResponse.json({ error: "Access restricted to students only" }, { status: 403 });
        }
        const skills = await SkillTrackerService.syncUserSkills(user.id);
        const userData = await sql`
            SELECT manual_skills, last_skill_update
            FROM users
            WHERE id = ${user.id}
        `;
        return NextResponse.json({
            success: true,
            skills,
            manual_skills: userData[0]?.manual_skills || {},
            last_updated: userData[0]?.last_skill_update,
            taxonomy: SKILL_TAXONOMY
        });
    } catch (error) {
        console.error("Error in skills API:", error);
        return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
    }
}
export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        if ("json" in user) return user;
        const { skill, value } = await req.json();
        if (!SKILL_TAXONOMY.includes(skill)) {
            return NextResponse.json({ error: "Invalid skill category" }, { status: 400 });
        }
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
            return NextResponse.json({ error: "Value must be between 0 and 100" }, { status: 400 });
        }
        const userData = await sql`SELECT manual_skills FROM users WHERE id = ${user.id}`;
        const manualSkills = userData[0]?.manual_skills || {};
        manualSkills[skill] = numericValue;
        await sql`
            UPDATE users
            SET manual_skills = ${manualSkills}
            WHERE id = ${user.id}
        `;
        const updatedSkills = await SkillTrackerService.syncUserSkills(user.id);
        return NextResponse.json({
            success: true,
            skills: updatedSkills,
            manual_skills: manualSkills
        });
    } catch (error) {
        console.error("Error updating manual skills:", error);
        return NextResponse.json({ error: "Failed to update skills" }, { status: 500 });
    }
}
