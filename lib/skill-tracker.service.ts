import sql from "./db";

export const SKILL_TAXONOMY = [
    "competitive_programming",
    "backend",
    "frontend",
    "ai_ml",
    "mobile",
    "devops",
    "web3",
    "ui_ux"
] as const;

export type SkillType = typeof SKILL_TAXONOMY[number];

export interface SkillProfile {
    [key: string]: number;
}

export class SkillTrackerService {
    /**
     * Computes the dynamic skill profile for a student based on platform activity.
     */
    static async computeSystemSkills(userId: string): Promise<SkillProfile> {
        // 1. Get all solved problems with their tags and difficulty
        const solvedProblems = await sql`
            SELECT 
                p.id, 
                p.difficulty,
                ARRAY_AGG(t.name) as tags,
                pu.updated_at as solved_at
            FROM problems p
            JOIN problems_users pu ON p.id = pu.problemid
            LEFT JOIN problems_tags pt ON p.id = pt.problem_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE pu.userid = ${userId} AND pu.is_completed = 'solved'
            GROUP BY p.id, pu.updated_at
        `;

        // 2. Initialize skill scores
        const systemSkills: SkillProfile = {};
        SKILL_TAXONOMY.forEach(skill => systemSkills[skill] = 0);

        // 3. Process each solved problem
        const now = new Date();
        for (const problem of solvedProblems) {
            const difficultyWeight = problem.difficulty || 1;
            const solvedAt = new Date(problem.solved_at);

            // Recency weighting: 1.0 (today) down to 0.5 (older)
            const daysSinceSolved = (now.getTime() - solvedAt.getTime()) / (1000 * 60 * 60 * 24);
            const recencyFactor = Math.max(0.5, 1 - (daysSinceSolved / 365)); // Linear decay over a year

            const tags = problem.tags || [];
            for (const tag of tags) {
                const skillCategory = this.mapTagToSkill(tag);
                if (skillCategory) {
                    systemSkills[skillCategory] += difficultyWeight * recencyFactor;
                }
            }
        }

        // 4. Add hackathon participation
        const hackathons = await sql`
            SELECT h.id, hp.role, h.end_date
            FROM hackathons h
            JOIN hackathon_participants hp ON h.id = hp.hackathon_id
            WHERE hp.user_id = ${userId} AND h.status = 'COMPLETED'
        `;

        for (const hack of hackathons) {
            // Assume hackathons give a base score to relevant skills
            // For now, we contribute to a generic 'hackathon_xp' and later distribute or just add +5 to 'competitive_programming'
            // In a better version, hackathons would have tags too.
            systemSkills["competitive_programming"] += 5;
        }

        return systemSkills;
    }

    /**
     * Blends system skills with manual updates and normalizes them.
     */
    static normalizeSkills(systemSkills: SkillProfile, manualSkills: SkillProfile): SkillProfile {
        const blended: SkillProfile = {};

        SKILL_TAXONOMY.forEach(skill => {
            const sys = systemSkills[skill] || 0;
            const man = manualSkills[skill] || 0;

            // Blend: Manual updates contribute 40%, System 60%
            // If manual is explicitly high, it shifts the profile.
            blended[skill] = (sys * 0.6) + (man * 0.4);
        });

        // Normalize between 0 and 1
        const maxScore = Math.max(...Object.values(blended), 1); // Avoid division by zero

        const normalized: SkillProfile = {};
        SKILL_TAXONOMY.forEach(skill => {
            normalized[skill] = Number((blended[skill] / maxScore).toFixed(2));
        });

        return normalized;
    }

    /**
     * Updates the user's skill profile in the database.
     */
    /**
     * Updates the user's skill profile in the database.
     */
    static async syncUserSkills(userId: string) {
        try {
            const systemSkills = await this.computeSystemSkills(userId);

            // Get manual skills from DB
            const user = await sql`SELECT manual_skills FROM users WHERE id = ${userId}`;
            const manualSkills = user[0]?.manual_skills || {};

            const normalizedSkills = this.normalizeSkills(systemSkills, manualSkills);

            await sql`
                UPDATE users 
                SET skills = ${normalizedSkills}, last_skill_update = NOW()
                WHERE id = ${userId}
            `;

            return normalizedSkills;
        } catch (error) {
            console.error("Error syncing skills:", error);
            // Fallback: return existing skills or zeros
            const user = await sql`SELECT skills FROM users WHERE id = ${userId}`;
            if (user[0]?.skills && Object.keys(user[0].skills).length > 0) {
                return user[0].skills;
            }
            const defaults: SkillProfile = {};
            SKILL_TAXONOMY.forEach(s => defaults[s] = 0);
            return defaults;
        }
    }

    private static mapTagToSkill(tag: string): SkillType | null {
        const t = tag.toLowerCase();
        if (t.includes("react") || t.includes("front") || t.includes("css") || t.includes("html") || t.includes("tailwind")) return "frontend";
        if (t.includes("node") || t.includes("back") || t.includes("express") || t.includes("sql") || t.includes("db") || t.includes("api")) return "backend";
        if (t.includes("python") || t.includes("ml") || t.includes("ai") || t.includes("tensor") || t.includes("nlp") || t.includes("data scientist")) return "ai_ml";
        if (t.includes("android") || t.includes("ios") || t.includes("mobile") || t.includes("react native") || t.includes("flutter")) return "mobile";
        if (t.includes("docker") || t.includes("k8s") || t.includes("aws") || t.includes("cicd") || t.includes("cloud") || t.includes("devops")) return "devops";
        if (t.includes("crypto") || t.includes("web3") || t.includes("blockchain") || t.includes("solidity") || t.includes("eth")) return "web3";
        if (t.includes("design") || t.includes("ui") || t.includes("ux") || t.includes("figma") || t.includes("prototype")) return "ui_ux";
        if (t.includes("algorithm") || t.includes("logic") || t.includes("dsa") || t.includes("competitive") || t.includes("leet")) return "competitive_programming";

        return null;
    }
}
