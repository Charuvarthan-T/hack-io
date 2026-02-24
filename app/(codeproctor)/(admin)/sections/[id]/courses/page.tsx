"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, Plus, X, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
interface Course {
  course_id: string;
  course_name: string;
}
interface Faculty {
  id: string;
  name: string;
  email: string;
}
interface CourseWithFaculty {
  course_id: string;
  course_name: string;
  faculty: Faculty[];
}
interface ApiResponse {
  status: boolean;
  data: Course[];
  error?: any;
}
interface FacultyResponse {
  status: boolean;
  data: Faculty[];
  error?: any;
}
export default function SectionCoursesPage() {
  const [coursesWithFaculty, setCoursesWithFaculty] = useState<CourseWithFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableFaculty, setAvailableFaculty] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedCourseName, setSelectedCourseName] = useState<string>("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const sectionId = params.id as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFacultyId, setDeleteFacultyId] = useState<string>("");
  const [deleteCourseId, setDeleteCourseId] = useState<string>("");
  const [facultyName, setFacultyName] = useState<string>("");
  const fetchCoursesWithFaculty = async () => {
    try {
      setLoading(true);
      const coursesResponse = await fetch(`/api/sections/${sectionId}/courses`);
      const coursesData: ApiResponse = await coursesResponse.json();
      if (!coursesData.status || !coursesData.data) {
        setError(coursesData.error || "Failed to fetch courses");
        return;
      }
      const coursesWithFacultyPromises = coursesData.data.map(async (course) => {
        try {
          const facultyResponse = await fetch(`/api/sections/${sectionId}/courses/${course.course_id}/assigned`);
          const facultyData: FacultyResponse = await facultyResponse.json();
          return {
            course_id: course.course_id,
            course_name: course.course_name,
            faculty: facultyData.status ? facultyData.data : []
          };
        } catch (err) {
          console.error(`Error fetching faculty for course ${course.course_id}:`, err);
          return {
            course_id: course.course_id,
            course_name: course.course_name,
            faculty: []
          };
        }
      });
      const coursesWithFacultyData = await Promise.all(coursesWithFacultyPromises);
      setCoursesWithFaculty(coursesWithFacultyData);
    } catch (err) {
      setError("An error occurred while fetching courses");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (sectionId) {
      fetchCoursesWithFaculty();
    }
  }, [sectionId]);
  const fetchAvailableFaculty = async (courseId: string) => {
    try {
      const response = await fetch(`/api/sections/${sectionId}/courses/${courseId}/faculty`);
      const data: FacultyResponse = await response.json();
      if (data.status && data.data) {
        setAvailableFaculty(data.data);
      } else {
        setError(data.error || "Failed to fetch available faculty");
        toast.error("Failed to fetch available faculty");
      }
    } catch (err) {
      setError("An error occurred while fetching available faculty");
      toast.error("An error occurred while fetching available faculty");
      console.error("Error fetching available faculty:", err);
    }
  };
  const handleAssignFaculty = (courseId: string, courseName: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseName(courseName);
    setSelectedFacultyId("");
    setIsAssignDialogOpen(true);
    fetchAvailableFaculty(courseId);
  };
  const handleConfirmAssign = async () => {
    if (!selectedFacultyId || !selectedCourseId) {
      toast.error("Please select a faculty member");
      return;
    }
    setAssignLoading(true);
    try {
      const response = await fetch(`/api/sections/${sectionId}/courses/${selectedCourseId}/faculty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ facultyId: selectedFacultyId }),
      });
      const data = await response.json();
      if (data.status) {
        toast.success("Faculty assigned successfully");
        setIsAssignDialogOpen(false);
        await fetchCoursesWithFaculty();
      } else {
        toast.error(data.error || "Failed to assign faculty");
      }
    } catch (err) {
      toast.error("An error occurred while assigning faculty");
      console.error("Error assigning faculty:", err);
    } finally {
      setAssignLoading(false);
    }
  };
  const confirmRemoveFaculty = async (courseId: string, facultyId: string) => {
    try {
      const response = await fetch(`/api/sections/${sectionId}/courses/${courseId}/faculty?facultyId=${facultyId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.status) {
        toast.success("Faculty removed successfully");
        await fetchCoursesWithFaculty();
      } else {
        toast.error(data.error || "Failed to remove faculty");
      }
    } catch (err) {
      toast.error("An error occurred while removing faculty");
      console.error("Error removing faculty:", err);
    }
  };
  const handleRemoveFaculty = async (courseId: string, facultyId: string, facultyName: string) => {
    setDeleteDialogOpen(true);
    setDeleteCourseId(courseId);
    setDeleteFacultyId(facultyId);
    setFacultyName(facultyName);
  };
  const courseGroups = coursesWithFaculty.reduce((groups, course) => {
    groups[course.course_id] = {
      course_name: course.course_name,
      faculty: course.faculty.map(f => ({
        faculty_id: f.id,
        faculty_name: f.name,
        faculty_email: f.email,
      }))
    };
    return groups;
  }, {} as Record<string, { course_name: string; faculty: Array<{ faculty_id: string; faculty_name: string; faculty_email: string }> }>);
  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Section Courses
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage courses and their assigned faculty for this section.
          </p>
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Assigned Courses</h2>
        <p className="text-sm text-muted-foreground">
          {coursesWithFaculty.length} courses from the semester curriculum
        </p>
      </div>
      {coursesWithFaculty.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                No faculty courses
              </h3>
              <p className="text-muted-foreground mb-4">
                No faculty members are assigned to courses in this section yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(courseGroups).map(([courseId, courseData]) => (
            <Card key={courseId} className="border h-[280px] flex flex-col">
              <CardContent className="p-4 flex flex-col h-full">
                {}
                <div className="flex items-start justify-between mb-3 flex-shrink-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight truncate">
                        {courseData.course_name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        ID: {courseId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {courseData.faculty.length}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleAssignFaculty(courseId, courseData.course_name)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Assign Faculty
                    </Button>
                  </div>
                </div>
                {}
                <div className="flex-1 mb-0 min-h-0">
                  {courseData.faculty.length > 0 ? (
                    <div className="h-full">
                      <div className="text-xs text-muted-foreground font-medium mb-2 flex-shrink-0">
                        Faculty ({courseData.faculty.length}):
                      </div>
                      <div className="h-[calc(100%-20px)] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {courseData.faculty.map((faculty) => (
                          <div
                            key={faculty.faculty_id}
                            className="flex items-center justify-between bg-muted/30 p-2 rounded text-xs border"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {faculty.faculty_name}
                              </p>
                              <p className="text-muted-foreground truncate">
                                {faculty.faculty_email}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive ml-1 flex-shrink-0"
                              onClick={() => handleRemoveFaculty(courseId, faculty.faculty_id, faculty.faculty_name)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted/10 rounded border-dashed border">
                      <div className="text-center">
                        <Users className="h-6 w-6 mx-auto mb-1 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">No faculty assigned</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirm Removal"
        description={`Are you sure you want to remove ${facultyName} from this course?`}
        onConfirm={async () => {
          setDeleteDialogOpen(false);
          await confirmRemoveFaculty(deleteCourseId, deleteFacultyId);
        }}
      />
      {}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Faculty to Course</DialogTitle>
            <DialogDescription>
              Select a faculty member to assign to <strong>{selectedCourseName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {availableFaculty.length > 0 ? (
              <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a faculty member..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFaculty.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{faculty.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No available faculty members</p>
                  <p className="text-xs">All faculty are already assigned to this course.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              disabled={assignLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAssign}
              disabled={assignLoading || !selectedFacultyId || availableFaculty.length === 0}
            >
              {assignLoading ? "Assigning..." : "Assign Faculty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
