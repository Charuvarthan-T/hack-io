import { requireAuth } from "@/lib/auth-helpers";
import { SkillTrackerService } from "@/lib/skill-tracker.service";
import { RecommendationService } from "@/lib/recommendation.service";
import { NextResponse } from "next/server";
export async function GET() {
    try {
        const user = await requireAuth();
        if ("json" in user) return user;
        if (user.role !== 'student' && user.role !== 'admin') {
            return NextResponse.json({ error: "Access restricted to students only" }, { status: 403 });
        }
        const skills = await SkillTrackerService.syncUserSkills(user.id);
        const recommendations = await RecommendationService.getRecommendations(skills);
        return NextResponse.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error("Error in recommendations API:", error);
        return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
    }
}
