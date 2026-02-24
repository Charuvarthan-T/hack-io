import { requireAuth } from "@/lib/auth-helpers";
import { getCoursesBySemester } from "@/repository/semester-course.repository";
import { getCoursesByUserId } from "@/repository/semester.repository";
import { getMyCoursesForFaculty } from "@/repository/user.repository";
import { NextRequest } from "next/server";
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();
  if ("status" in user) {
    return user;
  }
  const { id: targetUserId } = await params;
  if (user.role === "admin") {
    const courses = await getMyCoursesForFaculty(targetUserId);
    return new Response(JSON.stringify({ courses }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else if (user.role === "faculty" && user.id === targetUserId) {
    const courses = await getMyCoursesForFaculty(user.id);
    return new Response(JSON.stringify({ courses }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else if (user.role === "student" && user.id === targetUserId) {
    const courses = await getCoursesByUserId(user.id);
    return new Response(JSON.stringify({ courses }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
}
