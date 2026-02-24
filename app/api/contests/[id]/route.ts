import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getContestById,
  updateContest,
  deleteContest,
  canUserAccessContest,
  getContestStatistics,
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
    if (session.user.role === "student") {
      const canAccess = await canUserAccessContest(contestId, session.user.id);
      if (!canAccess) {
        return NextResponse.json(
          { error: "You don't have access to this contest" },
          { status: 403 }
        );
      }
    }
    const contest = await getContestById(contestId);
    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }
    if (session.user.role === "admin" || session.user.role === "faculty") {
      const stats = await getContestStatistics(contestId);
      return NextResponse.json({ contest, stats });
    }
    return NextResponse.json({ contest });
  } catch (error) {
    console.error("Error fetching contest:", error);
    return NextResponse.json(
      { error: "Failed to fetch contest" },
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
    const { title, description, start_time, end_time, duration_minutes, is_active } = body;
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (start_time !== undefined) updates.start_time = new Date(start_time);
    if (end_time !== undefined) updates.end_time = new Date(end_time);
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
    if (is_active !== undefined) updates.is_active = is_active;
    const contest = await updateContest(contestId, updates);
    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ contest });
  } catch (error) {
    console.error("Error updating contest:", error);
    return NextResponse.json(
      { error: "Failed to update contest" },
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
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: contestId } = await params;
    const contest = await deleteContest(contestId);
    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Contest deleted successfully" });
  } catch (error) {
    console.error("Error deleting contest:", error);
    return NextResponse.json(
      { error: "Failed to delete contest" },
      { status: 500 }
    );
  }
}
