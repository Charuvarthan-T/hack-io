import sql from "@/lib/db";
export async function getAllUsers() {
  try {
    const users = await sql`SELECT * FROM users`;
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}
export async function getUsersWithPagination(
  page: number,
  pageSize: number,
  search: string,
  sortBy: string,
  sortOrder: string
) {
  try {
    const offset = (page - 1) * pageSize;
  const allowedSortColumns = ["id", "name", "email", "role", "points_earned"];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "id";
    const safeSortOrder = sortOrder === "desc" ? "DESC" : "ASC";
    const textColumns = ["name", "email", "role"];
    const safeSortExpr = textColumns.includes(safeSortBy)
      ? `LOWER(${safeSortBy})`
      : safeSortBy;
    let users, totalResult;
    if (search) {
      search = search.trim();
      const searchPattern = `%${search}%`;
      try {
        users = await sql`
          SELECT id, name, email, role, COALESCE(points_earned, 0) as points_earned FROM users
          WHERE name ILIKE ${searchPattern} OR role ILIKE ${searchPattern}
          ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } catch (e) {
        const err: any = e;
        console.warn('points_earned column missing or query failed; falling back to query without points:', err?.message || err);
        users = await sql`
          SELECT id, name, email, role FROM users
          WHERE name ILIKE ${searchPattern} OR role ILIKE ${searchPattern}
          ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
          LIMIT ${pageSize} OFFSET ${offset}
        `;
        users = users.map((u: any) => ({ ...u, points_earned: 0 }));
      }
      totalResult = await sql`
        SELECT COUNT(*) as count FROM users
        WHERE name ILIKE ${searchPattern} OR email ILIKE ${searchPattern}
      `;
    } else {
      try {
        users = await sql`
          SELECT id, name, email, role, COALESCE(points_earned, 0) as points_earned FROM users
          ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } catch (e) {
        const err: any = e;
        console.warn('points_earned column missing or query failed; falling back to query without points:', err?.message || err);
        users = await sql`
          SELECT id, name, email, role FROM users
          ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
          LIMIT ${pageSize} OFFSET ${offset}
        `;
        users = users.map((u: any) => ({ ...u, points_earned: 0 }));
      }
      totalResult = await sql`SELECT COUNT(*) as count FROM users`;
    }
    const total = parseInt(totalResult[0].count);
    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error getting paginated users:", error);
    throw error;
  }
}
export async function deleteUser(userId: string) {
  try {
    await sql`DELETE FROM users WHERE id = ${userId}`;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
export async function assignRoleToUser(userId: string, role: string) {
  try {
    await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
  } catch (error) {
    console.error("Error assigning role to user:", error);
    throw error;
  }
}
export async function getMyCoursesForFaculty(facultyId: string) {
  try {
    const courses = await sql`
      SELECT c.id, c.name, s.name as section_name, sm.name as semester_name
      FROM faculty_courses_section fcs
      JOIN courses c ON fcs.courseid = c.id
      JOIN sections s ON fcs.sectionid = s.id
      JOIN semesters sm ON s.semesterid = sm.id
      WHERE fcs.userid = ${facultyId}
  ORDER BY LOWER(c.name) ASC`;
    return courses;
  } catch (error) {
    console.error("Error getting my courses for faculty:", error);
    throw error;
  }
}
export async function getMyCoursesForStudent(studentId: string) {
  try {
    const courses = await sql`
      SELECT DISTINCT c.id, c.name, s.name as section_name, sm.name as semester_name, s.id as section_id, LOWER(c.name) as course_name_lower
      FROM sections_users su
      JOIN sections s ON su.sectionid = s.id
      JOIN semesters sm ON s.semesterid = sm.id
      JOIN semesters_courses sc ON sm.id = sc.sem_id
      JOIN courses c ON sc.course_id = c.id
      WHERE su.userid = ${studentId}
      ORDER BY course_name_lower ASC`;
    return courses;
  } catch (error) {
    console.error("Error getting my courses for student:", error);
    throw error;
  }
}
export async function getUserPoints(userId: string) {
  try {
    const res =
      await sql`SELECT COALESCE(points_earned, 0) as points_earned FROM users WHERE id = ${userId}`;
    return res[0]?.points_earned ?? 0;
  } catch (error) {
    console.error("Error getting user points:", error);
    throw error;
  }
}
