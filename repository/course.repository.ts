import sql from "@/lib/db";
import { course } from "@/types/types";
export async function getAllCourses() {
  try {
    const data = await sql`select id, name from courses`;
    return { status: true, data: data };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function getCoursesWithPagination(
  page: number,
  pageSize: number,
  search: string,
  sortBy: string,
  sortOrder: string
) {
  try {
    const offset = (page - 1) * pageSize;
    const allowedSortColumns = ["id", "name"];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "id";
    const safeSortOrder = sortOrder === "desc" ? "DESC" : "ASC";
    const safeSortExpr = safeSortBy === "name" ? "LOWER(name)" : safeSortBy;
    let courses, totalResult;
    if (search) {
      const searchPattern = `%${search}%`;
      courses = await sql`
        SELECT id, name FROM courses
        WHERE name ILIKE ${searchPattern}
  ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as count FROM courses
        WHERE name ILIKE ${searchPattern}
      `;
    } else {
      courses = await sql`
        SELECT id, name FROM courses
  ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`SELECT COUNT(*) as count FROM courses`;
    }
    const total = parseInt(totalResult[0].count);
    return {
      data: courses,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error getting paginated courses:", error);
    throw error;
  }
}
export async function editCourse(body: course) {
  try {
    await sql`UPDATE courses SET name=${body.name} WHERE id=${body.id}`;
    return {
      success: true,
      message: `Successfully updated course ${body.id}`,
    };
  } catch (e) {
    console.log(e);
    return { success: false, message: `Update course ${body.id} failed` };
  }
}
export async function createCourse(body: { name: string }) {
  try {
    const res =
      await sql`INSERT INTO courses (name) VALUES (${body.name}) RETURNING id, name`;
    return {
      success: true,
      message: `Added new course ${res[0].id} ${res[0].name}`,
    };
  } catch (e) {
    console.log(e);
    return { success: false, message: `Add new course failed` };
  }
}
export async function deleteCourse(id: string) {
  try {
    await sql`DELETE FROM courses WHERE id=${id}`;
    return { success: true, message: `Deleted course ${id}` };
  } catch (e) {
    console.log(e);
    return { success: false, message: `Delete course ${id} failed` };
  }
}
