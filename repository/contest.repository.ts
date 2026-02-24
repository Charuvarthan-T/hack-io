import sql from "@/lib/db";
export interface Contest {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface CreateContestDTO {
  title: string;
  description?: string;
  created_by: string;
  start_time: Date;
  end_time: Date;
  duration_minutes?: number;
  is_active?: boolean;
}
export interface UpdateContestDTO {
  title?: string;
  description?: string;
  start_time?: Date;
  end_time?: Date;
  duration_minutes?: number;
  is_active?: boolean;
}
export interface ContestProblem {
  id: string;
  contest_id: string;
  problem_id: string;
  points: number;
  order_index: number | null;
}
export interface ContestSubmission {
  id: string;
  contest_id: string;
  user_id: string;
  problem_id: string;
  is_solved: boolean;
  points_earned: number;
  submission_time: Date;
  started_at: Date | null;
}
export async function getContestsWithPagination(
  page: number,
  pageSize: number,
  search: string,
  sortBy: string,
  sortOrder: string
) {
  try {
    const offset = (page - 1) * pageSize;
    const allowedSortColumns = [
      "title",
      "start_time",
      "end_time",
      "is_active",
      "created_at",
    ];
    const safeSortBy = allowedSortColumns.includes(sortBy)
      ? sortBy
      : "created_at";
    const safeSortOrder = sortOrder === "desc" ? "DESC" : "ASC";
    const safeSortExpr = safeSortBy === 'title' ? 'LOWER(c.title)' : safeSortBy;
    let contests, totalResult;
    if (search) {
      const searchPattern = `%${search}%`;
      contests = await sql`
        SELECT c.*, u.name as created_by_name,
          (SELECT COUNT(*) FROM contests_problems WHERE contest_id = c.id) as problem_count,
          (SELECT COUNT(*) FROM contests_sections WHERE contest_id = c.id) as section_count
        FROM contests c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.title ILIKE ${searchPattern}
           OR c.description ILIKE ${searchPattern}
           OR u.name ILIKE ${searchPattern}
  ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as count
        FROM contests c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.title ILIKE ${searchPattern}
           OR c.description ILIKE ${searchPattern}
           OR u.name ILIKE ${searchPattern}
      `;
    } else {
      contests = await sql`
        SELECT c.*, u.name as created_by_name,
          (SELECT COUNT(*) FROM contests_problems WHERE contest_id = c.id) as problem_count,
          (SELECT COUNT(*) FROM contests_sections WHERE contest_id = c.id) as section_count
        FROM contests c
        LEFT JOIN users u ON c.created_by = u.id
  ORDER BY ${sql.unsafe(safeSortExpr)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as count FROM contests
      `;
    }
    const total = parseInt(totalResult[0].count);
    return {
      data: contests,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error getting paginated contests:", error);
    throw error;
  }
}
export async function getAllContests() {
  try {
    const contests = await sql`
      SELECT c.*, u.name as created_by_name
      FROM contests c
      INNER JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `;
    return contests;
  } catch (error) {
    console.error("Error getting all contests:", error);
    throw error;
  }
}
export async function getContestById(id: string) {
  try {
    const result = await sql`
      SELECT c.*, u.name as created_by_name
      FROM contests c
      INNER JOIN users u ON c.created_by = u.id
      WHERE c.id = ${id}
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error getting contest by id:", error);
    throw error;
  }
}
export async function createContest(contest: CreateContestDTO) {
  try {
    const result = await sql`
      INSERT INTO contests (title, description, created_by, start_time, end_time, duration_minutes, is_active)
      VALUES (${contest.title}, ${contest.description || null}, ${
      contest.created_by
    },
              ${contest.start_time}, ${contest.end_time}, ${
      contest.duration_minutes || null
    },
              ${contest.is_active !== undefined ? contest.is_active : false})
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error("Error creating contest:", error);
    throw error;
  }
}
export async function updateContest(id: string, updates: UpdateContestDTO) {
  try {
    const contest = await getContestById(id);
    if (updates.title !== undefined) {
      contest.title = updates.title;
    }
    if (updates.description !== undefined) {
      contest.description = updates.description;
    }
    if (updates.start_time !== undefined) {
      contest.start_time = updates.start_time;
    }
    if (updates.end_time !== undefined) {
      contest.end_time = updates.end_time;
    }
    if (updates.duration_minutes !== undefined) {
      contest.duration_minutes = updates.duration_minutes;
    }
    if (updates.is_active !== undefined) {
      contest.is_active = updates.is_active;
    }
    const result = await sql`
      UPDATE contests
      SET title = ${contest.title}, description = ${contest.description}, start_time = ${contest.start_time}, end_time = ${contest.end_time}, duration_minutes = ${contest.duration_minutes}, is_active = ${contest.is_active}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error updating contest:", error);
    throw error;
  }
}
export async function deleteContest(id: string) {
  try {
    const result = await sql`
      DELETE FROM contests WHERE id = ${id} RETURNING *
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error deleting contest:", error);
    throw error;
  }
}
export async function getContestProblems(contestId: string) {
  try {
    const problems = await sql`
      SELECT p.*, cp.points, cp.order_index, cp.id as contest_problem_id
      FROM contests_problems cp
      INNER JOIN problems p ON cp.problem_id = p.id
      WHERE cp.contest_id = ${contestId}
  ORDER BY cp.order_index ASC NULLS LAST, LOWER(p.title) ASC
    `;
    return problems;
  } catch (error) {
    console.error("Error getting contest problems:", error);
    throw error;
  }
}
export async function addProblemToContest(
  contestId: string,
  problemId: string,
  points: number = 10,
  orderIndex?: number
) {
  try {
    const result = await sql`
      INSERT INTO contests_problems (contest_id, problem_id, points, order_index)
      VALUES (${contestId}, ${problemId}, ${points}, ${orderIndex || null})
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error("Error adding problem to contest:", error);
    throw error;
  }
}
export async function updateContestProblemPoints(
  contestId: string,
  problemId: string,
  points: number,
  orderIndex?: number
) {
  try {
    const result = await sql`
      UPDATE contests_problems
      SET points = ${points}, order_index = ${orderIndex || null}
      WHERE contest_id = ${contestId} AND problem_id = ${problemId}
      RETURNING *
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error updating contest problem points:", error);
    throw error;
  }
}
export async function removeProblemFromContest(
  contestId: string,
  problemId: string
) {
  try {
    const result = await sql`
      DELETE FROM contests_problems
      WHERE contest_id = ${contestId} AND problem_id = ${problemId}
      RETURNING *
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error removing problem from contest:", error);
    throw error;
  }
}
export async function getAvailableProblems(contestId: string) {
  try {
    const problems = await sql`
      SELECT p.*, u.name as created_by_name
      FROM problems p
      INNER JOIN users u ON p.created_by = u.id
      WHERE p.id NOT IN (
        SELECT problem_id FROM contests_problems WHERE contest_id = ${contestId}
      )
  ORDER BY LOWER(p.title) ASC
    `;
    return problems;
  } catch (error) {
    console.error("Error getting available problems:", error);
    throw error;
  }
}
export async function getContestSections(contestId: string) {
  try {
    const sections = await sql`
      SELECT s.*, sem.name as semester_name, cs.id as contest_section_id
      FROM contests_sections cs
      INNER JOIN sections s ON cs.section_id = s.id
      INNER JOIN semesters sem ON s.semesterid = sem.id
      WHERE cs.contest_id = ${contestId}
  ORDER BY LOWER(s.name) ASC
    `;
    return sections;
  } catch (error) {
    console.error("Error getting contest sections:", error);
    throw error;
  }
}
export async function addSectionToContest(
  contestId: string,
  sectionId: string
) {
  try {
    const result = await sql`
      INSERT INTO contests_sections (contest_id, section_id)
      VALUES (${contestId}, ${sectionId})
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error("Error adding section to contest:", error);
    throw error;
  }
}
export async function removeSectionFromContest(
  contestId: string,
  sectionId: string
) {
  try {
    const result = await sql`
      DELETE FROM contests_sections
      WHERE contest_id = ${contestId} AND section_id = ${sectionId}
      RETURNING *
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error removing section from contest:", error);
    throw error;
  }
}
export async function getAvailableSections(contestId: string) {
  try {
    const sections = await sql`
      SELECT s.*, sem.name as semester_name
      FROM sections s
      INNER JOIN semesters sem ON s.semesterid = sem.id
      WHERE s.id NOT IN (
        SELECT section_id FROM contests_sections WHERE contest_id = ${contestId}
      )
  ORDER BY LOWER(s.name) ASC
    `;
    return sections;
  } catch (error) {
    console.error("Error getting available sections:", error);
    throw error;
  }
}
export async function recordContestSubmission(
  contestId: string,
  userId: string,
  problemId: string,
  isSolved: boolean,
  pointsEarned: number = 0
) {
  try {
    const result = await sql`
      INSERT INTO contest_submissions (contest_id, user_id, problem_id, is_solved, points_earned)
      VALUES (${contestId}, ${userId}, ${problemId}, ${isSolved}, ${pointsEarned})
      ON CONFLICT (contest_id, user_id, problem_id)
      DO UPDATE SET
        is_solved = ${isSolved},
        points_earned = ${pointsEarned},
        submission_time = now()
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error("Error recording contest submission:", error);
    throw error;
  }
}
export async function getUserContestSubmissions(
  contestId: string,
  userId: string
) {
  try {
    const submissions = await sql`
      SELECT cs.*, p.title as problem_title, p.description as problem_description
      FROM contest_submissions cs
      INNER JOIN problems p ON cs.problem_id = p.id
      WHERE cs.contest_id = ${contestId} AND cs.user_id = ${userId}
      ORDER BY cs.submission_time DESC
    `;
    return submissions;
  } catch (error) {
    console.error("Error getting user contest submissions:", error);
    throw error;
  }
}
export async function getContestLeaderboard(contestId: string) {
  try {
    const leaderboard = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(CASE WHEN cs.is_solved = true THEN 1 END) as solved_count,
        COALESCE(SUM(cs.points_earned), 0) as total_points,
        MAX(cs.submission_time) as last_submission
      FROM users u
      INNER JOIN contest_submissions cs ON u.id = cs.user_id
      WHERE cs.contest_id = ${contestId}
      GROUP BY u.id, u.name, u.email
      ORDER BY total_points DESC, solved_count DESC, last_submission ASC
    `;
    return leaderboard;
  } catch (error) {
    console.error("Error getting contest leaderboard:", error);
    throw error;
  }
}
export async function markContestStarted(contestId: string, userId: string) {
  try {
    const problems = await sql`
      SELECT problem_id FROM contests_problems WHERE contest_id = ${contestId}
    `;
    for (const problem of problems) {
      await sql`
        INSERT INTO contest_submissions (contest_id, user_id, problem_id, started_at)
        VALUES (${contestId}, ${userId}, ${problem.problem_id}, now())
        ON CONFLICT (contest_id, user_id, problem_id)
        DO UPDATE SET started_at = COALESCE(contest_submissions.started_at, now())
      `;
    }
    return { success: true };
  } catch (error) {
    console.error("Error marking contest as started:", error);
    throw error;
  }
}
export async function getContestsForStudent(userId: string) {
  try {
    const contests = await sql`
      SELECT DISTINCT c.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM contests_problems WHERE contest_id = c.id) as problem_count,
        (SELECT COUNT(CASE WHEN is_solved = true THEN 1 END)
         FROM contest_submissions
         WHERE contest_id = c.id AND user_id = ${userId}) as solved_count
      FROM contests c
      LEFT JOIN users u ON c.created_by = u.id
      INNER JOIN contests_sections cs ON c.id = cs.contest_id
      INNER JOIN sections_users su ON cs.section_id = su.sectionid
      WHERE su.userid = ${userId} AND c.is_active = true
      ORDER BY c.start_time DESC
    `;
    return contests;
  } catch (error) {
    console.error("Error getting contests for student:", error);
    throw error;
  }
}
export async function canUserAccessContest(contestId: string, userId: string) {
  try {
    const result = await sql`
      SELECT 1
      FROM contests_sections cs
      INNER JOIN sections_users su ON cs.section_id = su.sectionid
      WHERE cs.contest_id = ${contestId} AND su.userid = ${userId}
      LIMIT 1
    `;
    return result.length > 0;
  } catch (error) {
    console.error("Error checking user contest access:", error);
    throw error;
  }
}
export async function getContestStatistics(contestId: string) {
  try {
    const stats = await sql`
      SELECT
        COUNT(DISTINCT cs.user_id) as total_participants,
        COUNT(DISTINCT CASE WHEN cs.is_solved = true THEN cs.user_id END) as users_with_solutions,
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN cs.is_solved = true THEN 1 END) as solved_submissions,
        COALESCE(AVG(CASE WHEN cs.is_solved = true THEN cs.points_earned END), 0) as avg_points
      FROM contest_submissions cs
      WHERE cs.contest_id = ${contestId}
    `;
    return stats[0] || null;
  } catch (error) {
    console.error("Error getting contest statistics:", error);
    throw error;
  }
}
