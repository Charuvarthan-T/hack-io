"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { course, semester } from "@/types/types";
import { toast } from "sonner";
import { totalmem } from "os";
import { ConfirmDialog } from "@/components/confirm-dialog";
type SemesterCourse = {
  course_id: string;
  course_name: string;
};
export default function SemesterCoursesPage() {
  const params = useParams();
  const router = useRouter();
  const semesterId = params.id as string;
  const [semester, setSemester] = useState<semester | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<SemesterCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [courseToUnassign, setCourseToUnassign] = useState<{
    id: string;
    name: string;
  } | null>(null);
  useEffect(() => {
    fetchData();
  }, [semesterId]);
  async function fetchData() {
    setLoading(true);
    try {
      const semesterResponse = await fetch(`/api/semesters/${semesterId}`);
      if (semesterResponse.ok) {
        const semesterData = await semesterResponse.json();
        setSemester(semesterData[0]);
      }
      const assignedResponse = await fetch(
        `/api/semesters/${semesterId}/courses`
      );
      if (assignedResponse.ok) {
        const assignedData = await assignedResponse.json();
        setAssignedCourses(assignedData.data);
      }
      const coursesResponse = await fetch("/api/courses/all");
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setAvailableCourses(coursesData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }
  async function handleAssignCourse() {
    if (!selectedCourseId) {
      toast.error("Please select a course to assign");
      return;
    }
    setAssignLoading(true);
    try {
      const response = await fetch(`/api/semesters/${semesterId}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
        }),
      });
      if (response.ok) {
        setIsAssignDialogOpen(false);
        setSelectedCourseId("");
        await fetchData();
        toast.success("Course assigned successfully");
      } else {
        const error = await response.json();
        toast.error(
          `Failed to assign course: ${error.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error assigning course:", error);
      toast.error("Failed to assign course");
    } finally {
      setAssignLoading(false);
    }
  }
  async function handleUnassignCourse(courseId: string, courseName: string) {
    setCourseToUnassign({ id: courseId, name: courseName });
    setIsUnassignDialogOpen(true);
  }
  async function confirmUnassignCourse() {
    if (!courseToUnassign) return;
    try {
      const response = await fetch(`/api/semesters/${semesterId}/courses`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: courseToUnassign.id,
        }),
      });
      if (response.ok) {
        await fetchData();
        toast.success("Course unassigned successfully");
      } else {
        const error = await response.json();
        toast.error(
          `Failed to unassign course: ${error.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error unassigning course:", error);
      toast.error("Failed to unassign course");
    }
  }
  const unassignedCourses = availableCourses.filter(
    (course) =>
      !assignedCourses.some((assigned) => assigned.course_id === course.id)
  );
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Semester Courses
          </h1>
          {semester && (
            <p className="text-muted-foreground">
              {semester.name} - {semester.year}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Assigned Courses</h2>
          <p className="text-sm text-muted-foreground">
            {assignedCourses.length} course
            {assignedCourses.length !== 1 ? "s" : ""} assigned
          </p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Assign Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign Course to Semester</DialogTitle>
              <DialogDescription>
                Select a course to assign to this semester.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Course</label>
                <div className="col-span-3">
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAssignDialogOpen(false);
                  setSelectedCourseId("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleAssignCourse}
                disabled={assignLoading || !selectedCourseId}
              >
                {assignLoading ? "Assigning..." : "Assign Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {assignedCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                No courses assigned
              </h3>
              <p className="text-muted-foreground mb-4">
                This semester doesn't have any courses assigned yet.
              </p>
              <Button onClick={() => setIsAssignDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Assign First Course
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignedCourses.map((course) => (
            <Card key={course.course_id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">{course.course_name}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleUnassignCourse(course.course_id, course.course_name)
                  }
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    Course ID: {course.course_id}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={isUnassignDialogOpen}
        onOpenChange={setIsUnassignDialogOpen}
        title="Unassign Course"
        description={`Are you sure you want to unassign "${courseToUnassign?.name}" from this semester?`}
        onConfirm={confirmUnassignCourse}
        confirmText="Unassign"
        variant="destructive"
      />
    </div>
  );
}
