import sql from "@/lib/db";
export async function getSemesterCourses(semesterId: string) {
  try {
    const data = await sql`
      SELECT
        sc.course_id,
        c.name as course_name
      FROM semesters_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE sc.sem_id = ${semesterId}
  ORDER BY LOWER(c.name)
    `;
    return { status: true, data: data };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function assignCourseToSemester(semesterId: string, courseId: string) {
  try {
    const existing = await sql`
      SELECT * FROM semesters_courses
      WHERE sem_id = ${semesterId} AND course_id = ${courseId}
    `;
    if (existing.length > 0) {
      return { success: false, message: "Course is already assigned to this semester" };
    }
    await sql`
      INSERT INTO semesters_courses (sem_id, course_id)
      VALUES (${semesterId}, ${courseId})
    `;
    return { success: true, message: "Course assigned to semester successfully" };
  } catch (e) {
    console.log(e);
    return { success: false, message: "Failed to assign course to semester" };
  }
}
export async function unassignCourseFromSemester(semesterId: string, courseId: string) {
  try {
    const existing = await sql`
      SELECT * FROM semesters_courses
      WHERE sem_id = ${semesterId} AND course_id = ${courseId}
    `;
    if (existing.length === 0) {
      return { success: false, message: "Course assignment not found" };
    }
    await sql`
      DELETE FROM semesters_courses
      WHERE sem_id = ${semesterId} AND course_id = ${courseId}
    `;
    return { success: true, message: "Course unassigned from semester successfully" };
  } catch (e) {
    console.log(e);
    return { success: false, message: "Failed to unassign course from semester" };
  }
}
export async function getCoursesBySemester(semesterId: string) {
  try {
    const data = await sql`
      SELECT
        c.id,
        c.name
      FROM semesters_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE sc.sem_id = ${semesterId}
  ORDER BY LOWER(c.name)
    `;
    return { status: true, data: data };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
