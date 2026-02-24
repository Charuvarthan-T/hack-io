import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAllContests,
  getContestsWithPagination,
  createContest,
  getContestsForStudent,
} from "@/repository/contest.repository";
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const page = pageParam ? parseInt(pageParam) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam) : 10;
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const forStudent = searchParams.get("forStudent") === "true";
    if (forStudent || session.user.role === "student") {
      const contests = await getContestsForStudent(session.user.id);
      return NextResponse.json( contests );
    }
    const result = await getContestsWithPagination(
      page,
      pageSize,
      search,
      sortBy,
      sortOrder
    );
    console.log("Paginated contests result:", result);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching contests:", error);
    return NextResponse.json(
      { error: "Failed to fetch contests" },
      { status: 500 }
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin" && session.user.role !== "faculty") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const {
      title,
      description,
      start_time,
      end_time,
      duration_minutes,
      is_active,
    } = body;
    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Title, start_time, and end_time are required" },
        { status: 400 }
      );
    }
    const contest = await createContest({
      title,
      description,
      created_by: session.user.id,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      duration_minutes,
      is_active,
    });
    return NextResponse.json({ contest }, { status: 201 });
  } catch (error) {
    console.error("Error creating contest:", error);
    return NextResponse.json(
      { error: "Failed to create contest" },
      { status: 500 }
    );
  }
}
