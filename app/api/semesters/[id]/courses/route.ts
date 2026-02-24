import { NextRequest, NextResponse } from "next/server";
import {
  getSemesterCourses,
  assignCourseToSemester,
  unassignCourseFromSemester,
} from "../../../../../repository/semester-course.repository";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: semesterId } = await params;
    const result = await getSemesterCourses(semesterId);
    if (result.status) {
      return NextResponse.json({ data: result.data });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching semester courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch semester courses" },
      { status: 500 }
    );
  }
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: semesterId } = await params;
    const body = await request.json();
    const { courseId } = body;
    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }
    const result = await assignCourseToSemester(semesterId, courseId);
    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error assigning course to semester:", error);
    return NextResponse.json(
      { error: "Failed to assign course" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: semesterId } = await params;
    const body = await request.json();
    const { courseId } = body;
    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }
    const result = await unassignCourseFromSemester(semesterId, courseId);
    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error unassigning course from semester:", error);
    return NextResponse.json(
      { error: "Failed to unassign course" },
      { status: 500 }
    );
  }
}
