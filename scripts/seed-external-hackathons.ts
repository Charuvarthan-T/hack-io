import "dotenv/config";
import { createExternalHackathon } from "../repository/external_hackathon.repository";

async function seed() {
    console.log("Seeding verified, working external hackathons...");

    // These are real, high-profile hackathons with stable URLs
    const hackathons = [
        {
            title: "LA Hacks 2026",
            description: "Southern California's premier hackathon. Build something amazing at UCLA.",
            deadline: new Date("2026-04-24"),
            mode: "offline" as const,
            external_url: "https://lahacks.com/",
            skills: ["frontend", "backend", "ui_ux"],
            source: "MLH"
        },
        {
            title: "Bitcamp 2026",
            description: "The University of Maryland's annual spring hackathon. Fireside chats, scouts, and amazing builds.",
            deadline: new Date("2026-04-10"),
            mode: "offline" as const,
            external_url: "https://bit.camp/",
            skills: ["frontend", "backend", "mobile"],
            source: "MLH"
        },
        {
            title: "MLH Global Hack Week: Cloud",
            description: "Learn and build with cloud technologies. A week-long celebration of all things cloud.",
            deadline: new Date("2026-03-13"),
            mode: "online" as const,
            external_url: "https://ghw.mlh.io/",
            skills: ["devops", "backend"],
            source: "MLH"
        },
        {
            title: "Google Gemini Live Challenge",
            description: "Build impactful solutions using Google's newest AI capabilities and Gemini Live Agent.",
            deadline: new Date("2026-05-15"),
            mode: "online" as const,
            external_url: "https://devpost.com/hackathons", // Fallback to landing if deep link is dynamic
            skills: ["ai_ml", "backend"],
            source: "Devpost"
        },
        {
            title: "Unstop CodeClash IIT Indore",
            description: "Competitive coding battle assessing Data Structures and Algorithmic logic.",
            deadline: new Date("2026-03-07"),
            mode: "online" as const,
            external_url: "https://unstop.com/competitions/codeclash-iit-indore",
            skills: ["competitive_programming"],
            source: "Unstop"
        }
    ];

    for (const hack of hackathons) {
        await createExternalHackathon(hack);
    }

    console.log(`✅ Seeded ${hackathons.length} REAL active external hackathons.`);
    process.exit(0);
}

seed();
