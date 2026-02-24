import { getUpcomingExternalHackathons, getRecommendedExternalHackathons } from "@/repository/external_hackathon.repository";
import { SkillProfile } from "./skill-tracker.service";
export class RecommendationService {
    static async getRecommendations(studentSkills: SkillProfile) {
        const recommendations = await getRecommendedExternalHackathons(studentSkills, 5);
        return {
            type: "RECOMMENDED",
            hackathons: recommendations
        };
    }
}
