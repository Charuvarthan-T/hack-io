import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserContestSubmissions,
  recordContestSubmission,
} from "@/repository/contest.repository";
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
    const submissions = await getUserContestSubmissions(contestId, session.user.id);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching contest submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch contest submissions" },
      { status: 500 }
    );
  }
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: contestId } = await params;
    const body = await req.json();
    const { problemId, isSolved, pointsEarned } = body;
    if (!problemId) {
      return NextResponse.json(
        { error: "Problem ID is required" },
        { status: 400 }
      );
    }
    const submission = await recordContestSubmission(
      contestId,
      session.user.id,
      problemId,
      isSolved || false,
      pointsEarned || 0
    );
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error("Error recording contest submission:", error);
    return NextResponse.json(
      { error: "Failed to record contest submission" },
      { status: 500 }
    );
  }
}
