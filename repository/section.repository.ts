import sql from "@/lib/db";
import { section } from "@/types/types";
export async function getAssignedUsers(sectionid: string) {
  try {
    const users = await sql`
      SELECT u.* FROM users u
      INNER JOIN sections_users su ON u.id = su.userid
      WHERE su.sectionid = ${sectionid}
    `;
    return { status: true, data: users };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function getUnassignedUsers(sectionid: string) {
  try {
    const users = await sql`
      SELECT u.* FROM users u
      WHERE u.id NOT IN (
        SELECT su.userid FROM sections_users su
      )
      and u.role = 'student'
    `;
    return { status: true, data: users };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function assignUserToSection(sectionid: string, userid: string) {
  try {
    await sql`
      INSERT INTO sections_users (sectionid, userid)
      VALUES (${sectionid}, ${userid})
    `;
    return { status: true };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function unassignUserFromSection(
  sectionid: string,
  userid: string
) {
  try {
    await sql`
      DELETE FROM sections_users
      WHERE sectionid = ${sectionid} AND userid = ${userid}
    `;
    return { status: true };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export interface createSectionType {
  name: string;
  semesterid: string;
  departmentid: string;
  isactive?: boolean;
}
export async function createSection(newSection: createSectionType) {
  try {
    await sql`INSERT INTO sections (name, semesterid, isactive)
        VALUES (${newSection.name}, ${newSection.semesterid}, ${newSection.isactive})`;
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}
export async function getAllSections() {
  try {
    const sections =
      await sql`SELECT DISTINCT sections.name as section_name, semesters.name as semester_name, sections.isactive as is_active
        FROM sections
        INNER JOIN semesters ON sections.semesterid = semesters.id`;
    return { status: true, data: sections };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function getSectionsWithPagination(
  page: number,
  pageSize: number,
  search: string,
  sortBy: string,
  sortOrder: string
) {
  try {
    const offset = (page - 1) * pageSize;
    const allowedSortColumns = ["section_name", "semester_name", "is_active"];
    const safeSortBy = allowedSortColumns.includes(sortBy)
      ? sortBy
      : "section_name";
    const safeSortOrder = sortOrder === "desc" ? "DESC" : "ASC";
    const safeSortExpr =
      safeSortBy === 'section_name' ? 'section_name_lower' :
      safeSortBy === 'semester_name' ? 'semester_name_lower' :
      safeSortBy;
    let sections, totalResult;
    if (search) {
      const searchPattern = `%${search}%`;
      sections = await sql`
        SELECT DISTINCT sections.id, sections.name as section_name, semesters.name as semester_name, sections.isactive as is_active,
               LOWER(sections.name) as section_name_lower, LOWER(semesters.name) as semester_name_lower
        FROM sections
        INNER JOIN semesters ON sections.semesterid = semesters.id
        WHERE sections.name ILIKE ${searchPattern}
           OR semesters.name ILIKE ${searchPattern}
        ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(DISTINCT sections.id) as count
        FROM sections
        INNER JOIN semesters ON sections.semesterid = semesters.id
        WHERE sections.name ILIKE ${searchPattern}
           OR semesters.name ILIKE ${searchPattern}
      `;
    } else {
      sections = await sql`
        SELECT DISTINCT sections.id, sections.name as section_name, semesters.name as semester_name,
               sections.isactive as is_active, sections.semesterid,
               LOWER(sections.name) as section_name_lower, LOWER(semesters.name) as semester_name_lower
        FROM sections
        INNER JOIN semesters ON sections.semesterid = semesters.id
        ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(DISTINCT sections.id) as count
        FROM sections
        INNER JOIN semesters ON sections.semesterid = semesters.id
      `;
    }
    const total = parseInt(totalResult[0].count);
    return {
      data: sections,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error getting paginated sections:", error);
    throw error;
  }
}
export async function editSection(newSection: section) {
  try {
    await sql`UPDATE sections
        SET name = ${newSection.name}, semesterid = ${newSection.semesterid}, isactive = ${newSection.isactive}
        WHERE id = ${newSection.id}`;
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}
export async function deleteSection(id: string) {
  try {
    await sql`DELETE FROM sections WHERE id = ${id}`;
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}
export async function getCoursesForSection(sectionid: string) {
  try {
    const data = await sql`
      SELECT
        c.id as course_id,
        c.name as course_name
      FROM sections s
      JOIN semesters sem ON s.semesterid = sem.id
      JOIN semesters_courses sc ON sem.id = sc.sem_id
      JOIN courses c ON sc.course_id = c.id
      WHERE s.id = ${sectionid}
      ORDER BY LOWER(c.name)
    `;
    return { status: true, data: data };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function getAssignedFacultyForACourse(
  courseid: string,
  sectionid: string
) {
  try {
    const faculty = await sql`
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN faculty_courses_section fcs ON u.id = fcs.userid
      WHERE fcs.courseid = ${courseid} AND fcs.sectionid = ${sectionid} and (u.role = 'faculty' or u.role = 'admin')
    `;
    return { status: true, data: faculty };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function getAvailableFaculty(courseid: string, sectionid: string) {
  try {
    const faculty = await sql`
      SELECT u.id, u.name, u.email
      FROM users u
      WHERE u.role = 'faculty' OR u.role = 'admin'
        AND u.id NOT IN (
          SELECT fcs.userid
          FROM faculty_courses_section fcs
          WHERE fcs.courseid = ${courseid}
            AND fcs.sectionid = ${sectionid}
        )
      ORDER BY LOWER(u.name)
    `;
    return { status: true, data: faculty };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function assignFacultyToCourse(
  courseid: string,
  sectionid: string,
  userid: string
) {
  try {
    await sql`
      INSERT INTO faculty_courses_section (courseid, sectionid, userid)
      VALUES (${courseid}, ${sectionid}, ${userid})
    `;
    return { status: true };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
export async function removeFacultyFromCourse(
  courseid: string,
  sectionid: string,
  userid: string
) {
  try {
    await sql`
      DELETE FROM faculty_courses_section
      WHERE courseid = ${courseid} AND sectionid = ${sectionid} AND userid = ${userid}
    `;
    return { status: true };
  } catch (e) {
    console.log(e);
    return { status: false, error: e };
  }
}
