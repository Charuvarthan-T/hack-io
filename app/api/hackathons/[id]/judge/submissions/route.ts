import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubmissionForBlindJudging, getAssignedSubmissionsForJudge } from "@/repository/hackathon.repository";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: hackathonId } = await params;
        const { searchParams } = new URL(req.url);
        const submissionId = searchParams.get("submissionId");

        if (submissionId) {
            // Return single blind submission
            const submission = await getSubmissionForBlindJudging(submissionId);
            return NextResponse.json(submission);
        } else {
            // Return list of assigned submissions for judge
            const submissions = await getAssignedSubmissionsForJudge(hackathonId, session.user.id);
            return NextResponse.json(submissions);
        }
    } catch (error) {
        console.error("Error fetching judge submissions:", error);
        return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }
}
