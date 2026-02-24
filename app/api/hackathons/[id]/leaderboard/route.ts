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
        const { getUserRole } = await import("@/repository/hackathon.repository");
        const userRole = await getUserRole(hackathonId, session.user.id);
        const isOrganizer = userRole === 'ORGANIZER' || session.user.role === 'admin';
        const isJudge = userRole === 'JUDGE';
        const isParticipant = userRole === 'PARTICIPANT';
        const isResultsPhase = hackathon.phase === 'RESULTS';
        const isEvaluationPhase = hackathon.phase === 'EVALUATION';
        const canView = isOrganizer ||
                        ((isJudge || isParticipant) && (isEvaluationPhase || isResultsPhase));
        if (!canView) {
            return NextResponse.json({ error: "Leaderboard is currently hidden" }, { status: 403 });
        }
        const leaderboard = await getHackathonLeaderboard(hackathonId);
        return NextResponse.json({ leaderboard });
    } catch (error) {
        console.error("Error fetching hackathon leaderboard:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
