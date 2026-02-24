import { requireAuth } from "@/lib/auth-helpers";
import sql from "@/lib/db";
import { getMyCoursesForFaculty } from "@/repository/user.repository";
export async function GET() {
  try {
    const user = await requireAuth();
    if ("json" in user) {
      return user;
    }
    const facultyCourses = await getMyCoursesForFaculty(user.id);
    const coursesCount = await sql`
            SELECT COUNT(DISTINCT fcs.courseid) as count
            FROM faculty_courses_section fcs
            WHERE fcs.userid = ${user.id}
        `;
    const sectionsCount = await sql`
            SELECT COUNT(DISTINCT fcs.sectionid) as count
            FROM faculty_courses_section fcs
            WHERE fcs.userid = ${user.id}
        `;
    const studentsCount = await sql`
            SELECT COUNT(DISTINCT su.userid) as count
            FROM faculty_courses_section fcs
            JOIN sections_users su ON fcs.sectionid = su.sectionid
            WHERE fcs.userid = ${user.id}
        `;
    const problemsCount = await sql`
            SELECT COUNT(DISTINCT pc.problemid) as count
            FROM faculty_courses_section fcs
            JOIN problems_courses pc ON fcs.courseid = pc.courseid
            WHERE fcs.userid = ${user.id}
        `;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          courses: facultyCourses,
          statistics: {
            n_courses: coursesCount[0]?.count || 0,
            n_sections: sectionsCount[0]?.count || 0,
            n_students: studentsCount[0]?.count || 0,
            n_problems: problemsCount[0]?.count || 0,
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Faculty dashboard API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch faculty dashboard data",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
