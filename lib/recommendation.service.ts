import { getUpcomingExternalHackathons, getRecommendedExternalHackathons } from "@/repository/external_hackathon.repository";
import { SkillProfile } from "./skill-tracker.service";

export class RecommendationService {
    /**
     * Recommends external hackathons based on student skills.
     */
    static async getRecommendations(studentSkills: SkillProfile) {
        // 1. Get ranked recommendations (already filtered for matches in repo)
        const recommendations = await getRecommendedExternalHackathons(studentSkills, 5);

        return {
            type: "RECOMMENDED",
            hackathons: recommendations
        };
    }
}
