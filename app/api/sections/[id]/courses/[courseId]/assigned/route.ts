import { getAssignedFacultyForACourse } from "@/repository/section.repository";
export async function GET(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: sectionId, courseId } = await params;
    const result = await getAssignedFacultyForACourse(courseId, sectionId);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching assigned faculty:", error);
    return new Response(
      JSON.stringify({ status: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
