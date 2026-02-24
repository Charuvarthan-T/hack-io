import sql from "@/lib/db";
export interface testCase {
  input: string;
  output: string;
}
export interface createProblem {
  problemid: string;
  title: string;
  description: string;
  created_by: string;
  course?: string;
}
export async function getAllProblems() {
  try {
    const problems = await sql`SELECT * FROM problems`;
    return problems;
  } catch (error) {
    console.error("Error getting all problems:", error);
    throw error;
  }
}
export async function getProblemsWithPagination(
  page: number,
  pageSize: number,
  search: string,
  sortBy: string,
  sortOrder: string,
  userId: string
) {
  try {
    const offset = (page - 1) * pageSize;
    const allowedSortColumns = ["id", "title", "description", "created_at"];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "id";
    const safeSortOrder = sortOrder === "desc" ? "DESC" : "ASC";
    const textColumns = ["title", "description"];
    const safeSortExpr = textColumns.includes(safeSortBy)
      ? `${safeSortBy === 'title' ? 'LOWER(p.title)' : 'LOWER(p.description)'}`
      : safeSortBy;
    let problems, totalResult;
    if (search) {
      const searchPattern = `%${search}%`;
      problems = await sql`
        SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by, up.is_completed
        FROM problems p INNER JOIN users u ON p.created_by = u.id
        LEFT JOIN problems_users up ON p.id = up.problemid AND up.userid = ${userId}
        WHERE (p.title ILIKE ${searchPattern} OR p.description ILIKE ${searchPattern} OR p.id::text ILIKE ${searchPattern} OR up.is_completed::text ILIKE ${searchPattern})
  ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as count FROM problems p
        WHERE (p.title ILIKE ${searchPattern} OR p.description ILIKE ${searchPattern} OR p.id::text ILIKE ${searchPattern})
      `;
    } else {
      problems = await sql`
        SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by, up.is_completed
        FROM problems p INNER JOIN users u ON p.created_by = u.id
        LEFT JOIN problems_users up ON p.id = up.problemid AND up.userid = ${userId}
  ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as count FROM problems WHERE course IS NULL
      `;
    }
    const total = parseInt(totalResult[0].count);
    return {
      data: problems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error getting paginated problems:", error);
    throw error;
  }
}
export async function createProblem(newProblem: createProblem) {
  try {
    const result = await sql`
      INSERT INTO problems (id, title, description, created_by, course)
      VALUES (${newProblem.problemid}, ${newProblem.title}, ${
      newProblem.description
    }, ${newProblem.created_by}, ${newProblem.course || null})
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error("Error creating problem:", error);
    throw error;
  }
}
export async function getProblemById(id: string) {
  try {
    const problem =
      await sql`SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by
      FROM problems p INNER JOIN users u ON p.created_by = u.id
      WHERE p.id = ${id}`;
    return problem[0] || null;
  } catch (error) {
    console.error("Error getting problem by id:", error);
    throw error;
  }
}
export async function deleteProblem(id: string) {
  try {
    const result = await sql`DELETE FROM problems WHERE id = ${id} RETURNING *`;
    return result[0] || null;
  } catch (error) {
    console.error("Error deleting problem:", error);
    throw error;
  }
}
interface updateProblemDTO {
  title?: string;
  description?: string;
}
export async function editProblem(
  id: string,
  updatedProblem: updateProblemDTO
) {
  try {
    const result =
      await sql`UPDATE problems SET title = ${updatedProblem.title}, description = ${updatedProblem.description} WHERE id = ${id} RETURNING *`;
    return result[0] || null;
  } catch (error) {
    console.error("Error editing problem:", error);
    throw error;
  }
}
export async function MarkProblemCompletedUser(
  userId: string,
  problemId: string,
  isCompleted: string
) {
  await sql`INSERT INTO problems_users (userid, problemid, is_completed)
  VALUES (${userId}, ${problemId}, ${isCompleted})
  ON CONFLICT (userid, problemid)
  DO UPDATE SET is_completed = ${isCompleted}`;
}
export async function CheckProblemCompletedUser(
  userId: string,
  problemId: string
) {
  const result =
    await sql`SELECT is_completed FROM problems_users WHERE userid = ${userId} AND problemid = ${problemId}`;
  return result[0]?.is_completed || "unsolved";
}
export async function awardPointsForProblem(
  userId: string,
  problemId: string,
  points: number
) {
  try {
    const existing =
      await sql`SELECT is_completed FROM problems_users WHERE userid = ${userId} AND problemid = ${problemId}`;
    if (existing[0]?.is_completed === "solved") {
      const totals =
        await sql`SELECT points_earned FROM users WHERE id = ${userId}`;
      const totalPoints = totals[0]?.points_earned ?? 0;
      return { awarded: false, totalPoints };
    }
    await sql`
    INSERT INTO problems_users (userid, problemid, is_completed, updated_at)
    VALUES (${userId}, ${problemId}, 'solved', NOW())
    ON CONFLICT (userid, problemid)
    DO UPDATE SET is_completed = 'solved', updated_at = NOW()`;
    await sql`
    UPDATE users
    SET points_earned = COALESCE(points_earned, 0) + ${points}
    WHERE id = ${userId}`;
    const id = crypto.randomUUID();
    await sql`
    INSERT INTO user_points_log (id, userid, problemid, points)
    VALUES (${id}, ${userId}, ${problemId}, ${points})`;
    const totals =
      await sql`SELECT points_earned FROM users WHERE id = ${userId}`;
    const totalPoints = totals[0]?.points_earned ?? 0;
    return { awarded: true, totalPoints };
  } catch (error) {
    console.error("Error awarding points:", error);
    throw error;
  }
}
export async function getCourseSpecificProblems(courseId: string) {
  try {
    const problems = await sql`
      SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by, p.course
      FROM problems p
      INNER JOIN users u ON p.created_by = u.id
      WHERE p.course = ${courseId}
      ORDER BY p.created_at DESC
    `;
    return problems;
  } catch (error) {
    console.error("Error getting course-specific problems:", error);
    throw error;
  }
}
export interface ProblemTemplate {
  python?: string;
  java?: string;
  javascript?: string;
  c?: string;
  cpp?: string;
}
export async function createOrUpdateProblemTemplate(
  problemId: string,
  templates: ProblemTemplate
) {
  try {
    const result = await sql`
      INSERT INTO problem_templates (problem_id, python, java, javascript, c, cpp)
      VALUES (${problemId}, ${templates.python || null}, ${
      templates.java || null
    },
              ${templates.javascript || null}, ${templates.c || null}, ${
      templates.cpp || null
    })
      ON CONFLICT (problem_id)
      DO UPDATE SET
        python = EXCLUDED.python,
        java = EXCLUDED.java,
        javascript = EXCLUDED.javascript,
        c = EXCLUDED.c,
        cpp = EXCLUDED.cpp,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error("Error creating/updating problem template:", error);
    throw error;
  }
}
export async function getProblemTemplate(problemId: string) {
  try {
    const result = await sql`
      SELECT python, java, javascript, c, cpp
      FROM problem_templates
      WHERE problem_id = ${problemId}
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error getting problem template:", error);
    throw error;
  }
}
export async function getProblemTemplateByLanguage(
  problemId: string,
  language: string
) {
  try {
    const allowedLanguages = ["python", "java", "javascript", "c", "cpp"];
    if (!allowedLanguages.includes(language)) {
      throw new Error("Unsupported language");
    }
    const result = await sql`
      SELECT ${sql.unsafe(language)} as template_code
      FROM problem_templates
      WHERE problem_id = ${problemId}
    `;
    return result[0]?.template_code || "";
  } catch (error) {
    console.error("Error getting problem template by language:", error);
    throw error;
  }
}
export async function createProblemWithTestCases(
  problemData: createProblem,
  testCases: { input: string; output: string }[]
) {
  try {
    const problem = await createProblem(problemData);
    for (const testCase of testCases) {
      const testCaseResult = await sql`
        INSERT INTO testcases (input, output)
        VALUES (${testCase.input}, ${testCase.output})
        RETURNING id
      `;
      const testCaseId = testCaseResult[0].id;
      await sql`
        INSERT INTO problems_testcases (problem_id, testcase_id)
        VALUES (${problem.id}, ${testCaseId})
      `;
    }
    return problem;
  } catch (error) {
    console.error("Error creating problem with test cases:", error);
    throw error;
  }
}
export async function createProblemWithTemplates(
  problemData: createProblem,
  templates: ProblemTemplate
) {
  try {
    const problem = await createProblem(problemData);
    if (Object.keys(templates).length > 0) {
      await createOrUpdateProblemTemplate(problem.id, templates);
    }
    return problem;
  } catch (error) {
    console.error("Error creating problem with templates:", error);
    throw error;
  }
}
