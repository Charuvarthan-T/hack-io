import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubmissionForBlindJudging } from "@/repository/hackathon.repository";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string; submissionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const params = await context.params;
        const { id: hackathonId, submissionId } = params;

        const submission = await getSubmissionForBlindJudging(submissionId);
        if (!submission || !submission.repo_url) {
            return NextResponse.json({ error: "Submission or repository link not found" }, { status: 404 });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey || geminiApiKey.trim() === "") {
            return NextResponse.json({ error: "Gemini API Key is not configured on the server." }, { status: 500 });
        }

        // Extract repo path
        let repoPath = "";
        try {
            const urlObj = new URL(submission.repo_url);
            if (urlObj.hostname.includes("github.com")) {
                const parts = urlObj.pathname.split("/").filter(Boolean);
                if (parts.length >= 2) {
                    let repoName = parts[1];
                    if (repoName.endsWith(".git")) repoName = repoName.replace(".git", "");
                    repoPath = `${parts[0]}/${repoName}`;
                }
            }
        } catch (e) {
            console.error("Invalid repo URL:", submission.repo_url);
        }

        if (!repoPath) {
            return NextResponse.json({ error: "A valid public GitHub repository link is required for AI evaluation." }, { status: 400 });
        }

        // Fetch README
        let readmeText = "";
        try {
            const [baseInfoResMain, baseInfoResMaster] = await Promise.all([
                fetch(`https://raw.githubusercontent.com/${repoPath}/main/README.md`),
                fetch(`https://raw.githubusercontent.com/${repoPath}/master/README.md`)
            ]);

            if (baseInfoResMain.ok) {
                readmeText = await baseInfoResMain.text();
            } else if (baseInfoResMaster.ok) {
                readmeText = await baseInfoResMaster.text();
            } else {
                return NextResponse.json({ error: "No prominent README file found in the repository to analyze." }, { status: 404 });
            }
        } catch (err) {
            return NextResponse.json({ error: "Could not fetch README from the repository." }, { status: 500 });
        }

        const trimmedReadme = readmeText.substring(0, 15000); // 15k chars is well within limit

        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            scores: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    innovation: { type: SchemaType.INTEGER, description: "Novelty and uniqueness of the idea (0-10)" },
                                    technical_complexity: { type: SchemaType.INTEGER, description: "Level of technical challenge and skill shown (0-10)" },
                                    implementation_quality: { type: SchemaType.INTEGER, description: "Code quality, stability, and completion (0-10)" },
                                    ui_ux: { type: SchemaType.INTEGER, description: "General usability and user experience (0-10)" },
                                    impact: { type: SchemaType.INTEGER, description: "Potential real-world impact and feasibility (0-10)" },
                                    presentation_quality: { type: SchemaType.INTEGER, description: "Quality of the demo and explanation (0-10)" },
                                    ui: { type: SchemaType.INTEGER, description: "Visual aesthetics and design consistency (0-10)" },
                                    backend: { type: SchemaType.INTEGER, description: "Database design, API structure, and logic (0-10)" },
                                    graphs: { type: SchemaType.INTEGER, description: "Clarity and utility of graphs/analytics (0-10)" },
                                    discord_interaction: { type: SchemaType.INTEGER, description: "Engagement and interaction in Discord (0-10)" },
                                },
                            },
                            feedback: {
                                type: SchemaType.STRING,
                                description: "A detailed but concise explanation (1-2 paragraphs) for the assigned scores, highlighting strengths and weaknesses."
                            }
                        },
                        required: ["scores", "feedback"]
                    }
                }
            });

            const prompt = `You are an expert technical judge evaluating a hackathon project submission.
Based on the following README file from the project's GitHub repository, please assign a score from 0 to 10 for each rubric category. If information for a category is missing from the README (like Discord interaction or Demo quality), estimate mildly or provide a neutral baseline (e.g. 5). Also, provide a short justification for your scores.

README CONTENT:
"""
${trimmedReadme}
"""`;

            const result = await model.generateContent(prompt);
            const responseTxt = result.response.text();

            let parsed;
            try {
                parsed = JSON.parse(responseTxt);
            } catch (e) {
                return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
            }

            return NextResponse.json({ result: parsed });

        } catch (geminiError: any) {
            console.error("Gemini API Error details:", geminiError?.message || geminiError);
            let errorMessage = "AI evaluation failed due to an API error.";
            if (geminiError?.message?.includes("429") || geminiError?.status === 429) {
                errorMessage = "Quota exceeded. Please try again later.";
            } else if (geminiError?.message?.includes("403") || geminiError?.status === 403) {
                errorMessage = "API key restricted or unauthorized.";
            } else if (geminiError?.message?.includes("404")) {
                errorMessage = "AI model not found. Check model configuration.";
            }
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

    } catch (error) {
        console.error("Error generating evaluation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
