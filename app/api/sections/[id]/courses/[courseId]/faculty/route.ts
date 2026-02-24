import { getAvailableFaculty, assignFacultyToCourse, removeFacultyFromCourse } from "@/repository/section.repository";
export async function GET(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: sectionId, courseId } = await params;
    const result = await getAvailableFaculty(courseId, sectionId);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching available faculty:", error);
    return new Response(
      JSON.stringify({ status: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
export async function POST(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: sectionId, courseId } = await params;
    const { facultyId } = await request.json();
    if (!facultyId) {
      return new Response(
        JSON.stringify({ status: false, error: "Faculty ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const result = await assignFacultyToCourse(courseId, sectionId, facultyId);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error assigning faculty:", error);
    return new Response(
      JSON.stringify({ status: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const { id: sectionId, courseId } = await params;
    const url = new URL(request.url);
    const facultyId = url.searchParams.get('facultyId');
    if (!facultyId) {
      return new Response(
        JSON.stringify({ status: false, error: "Faculty ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const result = await removeFacultyFromCourse(courseId, sectionId, facultyId);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error removing faculty:", error);
    return new Response(
      JSON.stringify({ status: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
