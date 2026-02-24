import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getContestProblems,
  addProblemToContest,
  removeProblemFromContest,
  updateContestProblemPoints,
  getAvailableProblems,
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
    const searchParams = req.nextUrl.searchParams;
    const available = searchParams.get("available") === "true";
    if (available) {
      if (session.user.role !== "admin" && session.user.role !== "faculty") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const problems = await getAvailableProblems(contestId);
      return NextResponse.json({ problems });
    }
    const problems = await getContestProblems(contestId);
    return NextResponse.json({ problems });
  } catch (error) {
    console.error("Error fetching contest problems:", error);
    return NextResponse.json(
      { error: "Failed to fetch contest problems" },
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
    if (session.user.role !== "admin" && session.user.role !== "faculty") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: contestId } = await params;
    const body = await req.json();
    const { problemId, points, orderIndex } = body;
    if (!problemId) {
      return NextResponse.json(
        { error: "Problem ID is required" },
        { status: 400 }
      );
    }
    const result = await addProblemToContest(
      contestId,
      problemId,
      points || 10,
      orderIndex
    );
    return NextResponse.json({ problem: result }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding problem to contest:", error);
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return NextResponse.json(
        { error: "Problem already exists in contest" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add problem to contest" },
      { status: 500 }
    );
  }
}
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin" && session.user.role !== "faculty") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: contestId } = await params;
    const body = await req.json();
    const { problemId, points, orderIndex } = body;
    if (!problemId || points === undefined) {
      return NextResponse.json(
        { error: "Problem ID and points are required" },
        { status: 400 }
      );
    }
    const result = await updateContestProblemPoints(
      contestId,
      problemId,
      points,
      orderIndex
    );
    if (!result) {
      return NextResponse.json(
        { error: "Problem not found in contest" },
        { status: 404 }
      );
    }
    return NextResponse.json({ problem: result });
  } catch (error) {
    console.error("Error updating contest problem:", error);
    return NextResponse.json(
      { error: "Failed to update contest problem" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin" && session.user.role !== "faculty") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: contestId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const problemId = searchParams.get("problemId");
    if (!problemId) {
      return NextResponse.json(
        { error: "Problem ID is required" },
        { status: 400 }
      );
    }
    const result = await removeProblemFromContest(contestId, problemId);
    if (!result) {
      return NextResponse.json(
        { error: "Problem not found in contest" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Problem removed from contest" });
  } catch (error) {
    console.error("Error removing problem from contest:", error);
    return NextResponse.json(
      { error: "Failed to remove problem from contest" },
      { status: 500 }
    );
  }
}
