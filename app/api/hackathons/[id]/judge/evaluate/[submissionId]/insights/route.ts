import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubmissionForBlindJudging } from "@/repository/hackathon.repository";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cache for insights to avoid hitting the API repeatedly for the same submission
const insightsCache = new Map<string, { insight: string, timestamp: number }>();

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: hackathonId, submissionId } = await params;

        // Check cache first (valid for 24 hours)
        const cached = insightsCache.get(submissionId);
        if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24) {
            return NextResponse.json({ insight: cached.insight });
        }

        const submission = await getSubmissionForBlindJudging(submissionId);
        if (!submission || !submission.repo_url) {
            return NextResponse.json({ error: "Submission or repository link not found" }, { status: 404 });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey || geminiApiKey.trim() === "") {
            return NextResponse.json({ error: "Gemini API Key is not configured on the server." }, { status: 500 });
        }

        // Try to extract username and repo from the URL
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
            return NextResponse.json({ insight: "Could not analyze the project. A valid public GitHub repository link is required." });
        }

        // Try downloading from main or master branch
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
                return NextResponse.json({ insight: "No prominent README file found in the repository to analyze." });
            }
        } catch (err) {
            console.error("Error fetching README:", err);
            return NextResponse.json({ insight: "Could not fetch README from the repository to analyze." });
        }

        // Trim the README so it doesn't exceed Gemini token limits for small requests
        const trimmedReadme = readmeText.substring(0, 8000);

        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `You are an AI assistant helping a hackathon judge quickly understand a project submission.
Based on the following README file from the project's GitHub repository, please provide a concise insight (2-3 sentences max).
Explain:
1. What the project is.
2. What problem it solves.
3. Specifically to whom this project would be most beneficial.

If the README is empty or lacks information, just state that there isn't enough information to analyze.

README CONTENT:
"""
${trimmedReadme}
"""`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Store in cache
            insightsCache.set(submissionId, { insight: text, timestamp: Date.now() });

            return NextResponse.json({ insight: text });

        } catch (geminiError: any) {
            console.error("Gemini API Error details:", geminiError?.message || geminiError);

            let userMessage = "AI analysis is currently unavailable due to an API error.";
            if (geminiError?.message?.includes("429") || geminiError?.status === 429) {
                userMessage = "AI analysis is temporarily paused because the current free-tier quota limit has been reached. Please try again later.";
            } else if (geminiError?.message?.includes("403") || geminiError?.status === 403) {
                userMessage = "AI analysis is unavailable (API Key restricted or lacks permissions).";
            }

            // Return a 200 with the error message as the insight so the UI handles it gracefully
            return NextResponse.json({ insight: userMessage });
        }

    } catch (error) {
        console.error("Error generating insights:", error);
        return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }
}
