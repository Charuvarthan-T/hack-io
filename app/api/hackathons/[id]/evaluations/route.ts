import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RBACService } from "@/lib/rbac.service";
import { createOrUpdateEvaluation, getEvaluation, getSubmissionEvaluations } from "@/repository/evaluation.repository";
import { getSubmissionForBlindJudging } from "@/repository/hackathon.repository";

// POST /api/hackathons/[id]/evaluations - Create/Update evaluation
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: hackathonId } = await params;
        const body = await req.json();
        const { submissionId, ...scores } = body;

        // RBAC check
        const canScore = await RBACService.canExecute({
            userId: session.user.id,
            hackathonId,
            action: 'SCORE_PROJECT',
            resourceId: submissionId
        });

        if (!canScore) return NextResponse.json({ error: "Forbidden or Evaluation Locked" }, { status: 403 });

        console.log("Saving evaluation with payload:", JSON.stringify({ submissionId, judgeId: session.user.id, ...scores }, null, 2));

        const evaluation = await createOrUpdateEvaluation({
            submission_id: submissionId,
            judge_id: session.user.id,
            ...scores
        });

        return NextResponse.json(evaluation);
    } catch (error) {
        console.error("CRITICAL: Error saving evaluation:", error);
        return NextResponse.json({ 
            error: "Failed to save evaluation", 
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// GET /api/hackathons/[id]/evaluations?submissionId=xxx - Get evaluation for judge or all for organizer
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

        if (!submissionId) return NextResponse.json({ error: "submissionId required" }, { status: 400 });

        // If Judge, return their specific evaluation (including draft)
        if (session.user.role === 'judge' || await RBACService.canExecute({ userId: session.user.id, hackathonId, action: 'SCORE_PROJECT' })) {
            const evaluation = await getEvaluation(submissionId, session.user.id);
            return NextResponse.json(evaluation || {});
        }

        // Check if admin/organizer to see all evaluations
        const isOrganizer = session.user.role === 'admin'; // Simplify for now
        if (isOrganizer) {
            const evaluations = await getSubmissionEvaluations(submissionId);
            return NextResponse.json(evaluations);
        }

        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } catch (error) {
        console.error("Error fetching evaluations:", error);
        return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
    }
}
