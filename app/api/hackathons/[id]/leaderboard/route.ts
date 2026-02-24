import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHackathonLeaderboard } from "@/repository/evaluation.repository";
import { getHackathonById } from "@/repository/hackathon.repository";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: hackathonId } = await params;
        const hackathon = await getHackathonById(hackathonId);

        if (!hackathon) return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });

        // Leaderboard Visibility Rules:
        // 1. Organizers/Admins can always see it.
        // 2. Judges can see it during Evaluation/Results phase.
        // 3. Participants can ONLY see it during Results phase.

        const isOrganizer = session.user.role === 'admin'; // placeholder for RBAC
        const isResultsPhase = hackathon.phase === 'RESULTS';
        const isEvaluationPhase = hackathon.phase === 'EVALUATION';

        // Check for Judge/Participant roles (simplified check here, can use RBACService)
        // For now, if Results phase, everyone can see. If not, only organizers/judges.

        if (!isResultsPhase && !isOrganizer && session.user.role !== 'judge') {
            return NextResponse.json({ error: "Leaderboard is currently hidden" }, { status: 403 });
        }

        const leaderboard = await getHackathonLeaderboard(hackathonId);
        return NextResponse.json({ leaderboard });
    } catch (error) {
        console.error("Error fetching hackathon leaderboard:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
