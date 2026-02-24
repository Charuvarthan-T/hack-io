import { requireAuth } from "@/lib/auth-helpers";
import {
  assignProblemToCourse,
  unassignProblemFromCourse,
  getCourseProblems,
  getUnassignedProblems,
  assignMultipleProblems
} from "@/repository/course-problem.repository";
import { NextRequest } from "next/server";
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user instanceof Response) {
      return user;
    }
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const action = searchParams.get("action");
    if (!courseId) {
      return new Response(
        JSON.stringify({ error: "Course ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (action === "unassigned") {
      const result = await getUnassignedProblems(courseId);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const result = await getCourseProblems(courseId);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error in course-problems GET:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch course problems" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user instanceof Response) {
      return user;
    }
    const body = await req.json();
    const { courseId, problemIds, action } = body;
    if (!courseId) {
      return new Response(
        JSON.stringify({ error: "Course ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (action === "assign-multiple" && Array.isArray(problemIds)) {
      const result = await assignMultipleProblems(problemIds, courseId);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" }
      });
    } else if (action === "assign" && body.problemId) {
      const result = await assignProblemToCourse(body.problemId, courseId);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action or missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in course-problems POST:", error);
    return new Response(
      JSON.stringify({ error: "Failed to assign problems" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user instanceof Response) {
      return user;
    }
    const body = await req.json();
    const { courseId, problemId } = body;
    if (!courseId || !problemId) {
      return new Response(
        JSON.stringify({ error: "Course ID and Problem ID are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const result = await unassignProblemFromCourse(problemId, courseId);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in course-problems DELETE:", error);
    return new Response(
      JSON.stringify({ error: "Failed to unassign problem" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
