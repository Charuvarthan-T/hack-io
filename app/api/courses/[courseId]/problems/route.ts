import { requireAuth } from "@/lib/auth-helpers";
import { createProblemWithTestCases, deleteProblem } from "@/repository/problem.repository";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await requireAuth();
    if (user instanceof Response) {
      return user;
    }
    const { courseId } = params;
    const body = await req.json();
    const { title, description, testCases } = body;
    if (!title || !description) {
      return new Response(
        JSON.stringify({ error: "Title and description are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one test case is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    for (const testCase of testCases) {
      if (!testCase.input || !testCase.output) {
        return new Response(
          JSON.stringify({ error: "Each test case must have input and output" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    const problemData = {
      problemid: randomUUID(),
      title,
      description,
      created_by: user.id,
      course: courseId,
    };
    const problem = await createProblemWithTestCases(problemData, testCases);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Course-specific problem created successfully",
        data: problem,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating course-specific problem:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create course-specific problem" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await requireAuth();
    if (user instanceof Response) {
      return user;
    }
    const { courseId } = params;
    const body = await req.json();
    const { problemId } = body;
    if (!problemId) {
      return new Response(
        JSON.stringify({ error: "Problem ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const deletedProblem = await deleteProblem(problemId);
    if (!deletedProblem) {
      return new Response(
        JSON.stringify({ error: "Problem not found or could not be deleted" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Course-specific problem deleted successfully",
        data: deletedProblem,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting course-specific problem:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete course-specific problem" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
