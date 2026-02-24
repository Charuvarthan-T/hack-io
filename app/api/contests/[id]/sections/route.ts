import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getContestSections,
  addSectionToContest,
  removeSectionFromContest,
  getAvailableSections,
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
      const sections = await getAvailableSections(contestId);
      return NextResponse.json({ sections });
    }
    const sections = await getContestSections(contestId);
    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Error fetching contest sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch contest sections" },
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
    const { sectionId } = body;
    if (!sectionId) {
      return NextResponse.json(
        { error: "Section ID is required" },
        { status: 400 }
      );
    }
    const result = await addSectionToContest(contestId, sectionId);
    return NextResponse.json({ section: result }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding section to contest:", error);
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return NextResponse.json(
        { error: "Section already assigned to contest" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add section to contest" },
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
    const sectionId = searchParams.get("sectionId");
    if (!sectionId) {
      return NextResponse.json(
        { error: "Section ID is required" },
        { status: 400 }
      );
    }
    const result = await removeSectionFromContest(contestId, sectionId);
    if (!result) {
      return NextResponse.json(
        { error: "Section not found in contest" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Section removed from contest" });
  } catch (error) {
    console.error("Error removing section from contest:", error);
    return NextResponse.json(
      { error: "Failed to remove section from contest" },
      { status: 500 }
    );
  }
}
