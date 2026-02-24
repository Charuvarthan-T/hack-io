import { getCoursesForSection } from "@/repository/section.repository";
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const courses = await getCoursesForSection(id);
  return new Response(JSON.stringify(courses), {
    headers: { "Content-Type": "application/json" },
  });
}
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
}
