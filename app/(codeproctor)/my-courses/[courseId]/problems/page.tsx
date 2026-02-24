"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { problem } from "@/types/types";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft } from "lucide-react";
import { AssignProblemsDialog } from "@/components/assign-problems-dialog";
import { useSession } from "next-auth/react";
import { createCourseProblemColumns } from "./columns";
export default function CourseProblemsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const params = useParams();
  const courseId = params.courseId as string;
  const [problems, setProblems] = useState<problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseName, setCourseName] = useState<string>("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const solvedCount = problems.filter(
    (p) => p.solved_status === "solved"
  ).length;
  const unsolvedCount = problems.filter(
    (p) => p.solved_status === "unsolved"
  ).length;
  const fetchCourseProblems = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/courses/problems?courseId=${courseId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch course problems");
      }
      const data = await response.json();
      if (data.success) {
        const problemsWithStatus = (data.data || []).map(
          (problem: any, index: number) => ({
            ...problem,
            solved_status: index % 2 === 0 ? "solved" : "unsolved",
          })
        );
        setProblems(problemsWithStatus);
        if (data.data && data.data.length > 0) {
          setCourseName(`Course ${courseId}`);
        }
      } else {
        setError(data.error || "Failed to load problems");
      }
    } catch (err) {
      console.error("Error fetching course problems:", err);
      setError("Failed to load course problems");
    } finally {
      setLoading(false);
    }
  };
  const courseProblemsColumns = createCourseProblemColumns(
    userRole ?? "Student",
    fetchCourseProblems
  );
  useEffect(() => {
    if (courseId) {
      fetchCourseProblems();
    }
  }, [courseId]);
  const handleRefresh = () => {
    window.location.reload();
  };
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading course problems...</div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold">Course Problems</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">
                {courseName || `Course ${courseId}`} • {problems.length}{" "}
                problem(s)
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                >
                  {solvedCount} Solved
                </Badge>
                <Badge variant="outline">{unsolvedCount} Unsolved</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userRole !== "student" && (
            <Button onClick={() => setAssignDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Assign Problems
            </Button>
          )}
        </div>
      </div>
      <DataTable
        columns={courseProblemsColumns}
        data={problems}
        searchColumn="title"
      />
      {userRole !== "student" && (
        <AssignProblemsDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          courseId={courseId}
          courseName={courseName || `Course ${courseId}`}
        />
      )}
    </div>
  );
}
