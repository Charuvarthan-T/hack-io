import sql from "@/lib/db";
export interface CourseProblemAssignment {
  problemid: string;
  courseid: string;
}
export async function assignProblemToCourse(problemId: string, courseId: string) {
  try {
    const existing = await sql`
      SELECT 1 FROM problems_courses
      WHERE problemid = ${problemId} AND courseid = ${courseId}
    `;
    if (existing.length > 0) {
      return {
        success: true,
        message: "Problem is already assigned to this course",
        data: null
      };
    }
    const result = await sql`
      INSERT INTO problems_courses (problemid, courseid)
      VALUES (${problemId}, ${courseId})
      RETURNING *
    `;
    return {
      success: true,
      message: "Problem assigned to course successfully",
      data: result[0]
    };
  } catch (error) {
    console.error("Error assigning problem to course:", error);
    return {
      success: false,
      message: "Failed to assign problem to course",
      error
    };
  }
}
export async function unassignProblemFromCourse(problemId: string, courseId: string) {
  try {
    const result = await sql`
      DELETE FROM problems_courses
      WHERE problemid = ${problemId} AND courseid = ${courseId}
      RETURNING *
    `;
    return {
      success: true,
      message: "Problem unassigned from course successfully",
      data: result[0]
    };
  } catch (error) {
    console.error("Error unassigning problem from course:", error);
    return {
      success: false,
      message: "Failed to unassign problem from course",
      error
    };
  }
}
export async function getCourseProblems(courseId: string) {
  try {
    const problems = await sql`
      (
        SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by, 'assigned' as type
        FROM problems p
        INNER JOIN problems_courses pc ON p.id = pc.problemid
        INNER JOIN users u ON p.created_by = u.id
        WHERE pc.courseid = ${courseId} AND p.course IS NULL
      )
      UNION ALL
      (
        SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by, 'course-specific' as type
        FROM problems p
        INNER JOIN users u ON p.created_by = u.id
        WHERE p.course = ${courseId}
      )
      ORDER BY created_at DESC
    `;
    return {
      success: true,
      data: problems
    };
  } catch (error) {
    console.error("Error getting course problems:", error);
    return {
      success: false,
      message: "Failed to get course problems",
      error
    };
  }
}
export async function getUnassignedProblems(courseId: string) {
  try {
    const problems = await sql`
      SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by
      FROM problems p
      INNER JOIN users u ON p.created_by = u.id
      WHERE p.course IS NULL AND p.id NOT IN (
        SELECT problemid FROM problems_courses WHERE courseid = ${courseId}
      )
      ORDER BY p.created_at DESC
    `;
    return {
      success: true,
      data: problems
    };
  } catch (error) {
    console.error("Error getting unassigned problems:", error);
    return {
      success: false,
      message: "Failed to get unassigned problems",
      error
    };
  }
}
export async function assignMultipleProblems(problemIds: string[], courseId: string) {
  try {
    let assignedCount = 0;
    let skippedCount = 0;
    for (const problemId of problemIds) {
      const existing = await sql`
        SELECT 1 FROM problems_courses
        WHERE problemid = ${problemId} AND courseid = ${courseId}
      `;
      if (existing.length === 0) {
        await sql`
          INSERT INTO problems_courses (problemid, courseid)
          VALUES (${problemId}, ${courseId})
        `;
        assignedCount++;
      } else {
        skippedCount++;
      }
    }
    let message = `Successfully assigned ${assignedCount} problems to course`;
    if (skippedCount > 0) {
      message += ` (${skippedCount} were already assigned)`;
    }
    return {
      success: true,
      message,
      assignedCount,
      skippedCount
    };
  } catch (error) {
    console.error("Error assigning multiple problems:", error);
    return {
      success: false,
      message: "Failed to assign problems to course",
      error
    };
  }
}
