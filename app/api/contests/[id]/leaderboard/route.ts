import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getContestLeaderboard } from "@/repository/contest.repository";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: contestId } = await params;
    const leaderboard = await getContestLeaderboard(contestId);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching contest leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch contest leaderboard" },
      { status: 500 }
    );
  }
}
