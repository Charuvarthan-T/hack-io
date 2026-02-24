import sql from "@/lib/db";
import { semester } from "@/types/types";
export async function getAllSemesters() {
  try {
    const data = await sql`
            SELECT s.id, s.name, s.year, s.dept_id, d.name as department_name
            FROM semesters s
            LEFT JOIN departments d ON s.dept_id = d.id
        `;
    return { status: true, data: data };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function getSemestersWithPagination(
  page: number,
  pageSize: number,
  search: string,
  sortBy: string,
  sortOrder: string
) {
  try {
    const offset = (page - 1) * pageSize;
  const allowedSortColumns = ["id", "name", "year"];
  const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "id";
  const safeSortOrder = sortOrder === "desc" ? "DESC" : "ASC";
  const safeSortExpr = safeSortBy === 'name' ? 'LOWER(s.name)' : `s.${safeSortBy}`;
    let semesters, totalResult;
    if (search) {
      const searchPattern = `%${search}%`;
      semesters = await sql`
        SELECT s.id, s.name, s.year, s.dept_id, d.name as department_name
        FROM semesters s
        LEFT JOIN departments d ON s.dept_id = d.id
        WHERE s.name ILIKE ${searchPattern} OR s.year::text ILIKE ${searchPattern} OR d.name ILIKE ${searchPattern}
  ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as count FROM semesters s
        LEFT JOIN departments d ON s.dept_id = d.id
        WHERE s.name ILIKE ${searchPattern} OR s.year::text ILIKE ${searchPattern} OR d.name ILIKE ${searchPattern}
      `;
    } else {
      semesters = await sql`
        SELECT s.id, s.name, s.year, s.dept_id, d.name as department_name
        FROM semesters s
        LEFT JOIN departments d ON s.dept_id = d.id
  ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`SELECT COUNT(*) as count FROM semesters`;
    }
    const total = parseInt(totalResult[0].count);
    return {
      data: semesters,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error getting paginated semesters:", error);
    throw error;
  }
}
export async function editSemester(body: semester) {
  try {
    if (body.dept_id) {
      await sql`UPDATE semesters
            SET name=${body.name}, year=${body.year}, dept_id=${body.dept_id}
            WHERE id=${body.id}`;
    } else {
      await sql`UPDATE semesters
            SET name=${body.name}, year=${body.year}
            WHERE id=${body.id}`;
    }
    return {
      success: true,
      message: `Successfully updated semester ${body.id}`,
    };
  } catch (e) {
    console.log(e);
    return { success: false, message: `Update semester ${body.id} failed` };
  }
}
export async function createSemester(body: {
  name: string;
  year: string;
  department_id: string;
}) {
  try {
    const res =
      await sql`INSERT INTO semesters (name, year, dept_id) VALUES (${body.name}, ${body.year}, ${body.department_id}) RETURNING id, name, year`;
    return {
      success: true,
      message: `Added new semester ${res[0].id} ${res[0].name}`,
    };
  } catch (e) {
    console.log(e);
    return { success: false, message: `Add new semester failed` };
  }
}
export async function deleteSemester(id: string) {
  try {
    await sql`DELETE FROM semesters WHERE id=${id}`;
    return { success: true, message: `Deleted semester ${id}` };
  } catch (e) {
    console.log(e);
    return { success: false, message: `Delete semester ${id} failed` };
  }
}
export async function getCoursesByUserId(userId: string) {
  try {
    const courses = await sql`
     SELECT c.id, c.name, sec.name as section_name, s.name as semester_name
      FROM courses c
      JOIN semesters_courses sc ON c.id = sc.course_id
      JOIN semesters s ON sc.sem_id = s.id
      JOIN sections sec ON s.id = sec.semesterid
      JOIN sections_users su ON sec.id = su.sectionid
      WHERE su.userid = ${userId}
    `;
    return courses;
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function getSemesterById(semesterid: string){
  try{
    const semester = await sql`
    SELECT *
    FROM semesters s
    WHERE s.id = ${semesterid};
    `
    return semester;
  }
  catch(e){
    console.log(e);
    return {status: false, error:e};
  }
}
