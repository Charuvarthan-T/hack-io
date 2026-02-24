import sql from "@/lib/db";

export interface ExternalHackathon {
    id: string;
    title: string;
    description: string | null;
    deadline: Date | null;
    mode: "online" | "offline" | null;
    external_url: string;
    skills: string[]; // Normalized skills needed
    source: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface CreateExternalHackathonDTO {
    title: string;
    description?: string;
    deadline?: Date;
    mode?: "online" | "offline";
    external_url: string;
    skills?: string[];
    source?: string;
}

export async function createExternalHackathon(data: CreateExternalHackathonDTO) {
    try {
        const result = await sql`
            INSERT INTO external_hackathons (title, description, deadline, mode, external_url, skills, source)
            VALUES (${data.title}, ${data.description || null}, ${data.deadline || null}, ${data.mode || null}, ${data.external_url}, ${JSON.stringify(data.skills || [])}, ${data.source || null})
            ON CONFLICT (external_url) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                deadline = EXCLUDED.deadline,
                mode = EXCLUDED.mode,
                skills = EXCLUDED.skills,
                updated_at = NOW()
            RETURNING *
        `;
        return result[0] as ExternalHackathon;
    } catch (error) {
        console.error("Error creating external hackathon:", error);
        throw error;
    }
}

export async function getUpcomingExternalHackathons(limit: number = 10) {
    try {
        const result = await sql`
            SELECT * FROM external_hackathons 
            WHERE deadline IS NULL OR deadline >= NOW()
            ORDER BY deadline ASC NULLS LAST
            LIMIT ${limit}
        `;
        return result as ExternalHackathon[];
    } catch (error) {
        console.error("Error fetching external hackathons:", error);
        throw error;
    }
}

export async function getRecommendedExternalHackathons(studentSkills: Record<string, number>, limit: number = 5) {
    try {
        // Fetch all upcoming hackathons
        const hackathons = await getUpcomingExternalHackathons(50);

        // Compute relevance in JS (easier than complex SQL for JSONB weights)
        const scored = hackathons.map(h => {
            let score = 0;
            const hSkills = h.skills || [];

            hSkills.forEach(skill => {
                score += (studentSkills[skill] || 0);
            });

            return { ...h, relevanceScore: score };
        });

        // Rank, filter (only show matches), and take top X
        return scored
            .filter(h => h.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    } catch (error) {
        console.error("Error recommending external hackathons:", error);
        throw error;
    }
}
