"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DataTable } from "@/components/data-table";
import { course } from "@/types/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createCourseColumns } from "./columns";
export default function MyCoursesPage() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const [courses, setCourses] = useState<course[]>([]);
  const [loading, setLoading] = useState(true);
  const myCourseColumns = createCourseColumns(userRole ?? "Student");
  const fetchMyCourses = async () => {
    if (!session?.user?.id) {
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${session.user.id}/courses`);
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Error fetching my courses:", error);
      toast.error("Failed to load your courses");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchMyCourses();
    }
  }, [session, status]);
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to view your courses.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">My Courses</CardTitle>
          <CardDescription>
            View all courses assigned to you as faculty
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No courses assigned to you yet.
              </p>
            </div>
          ) : (
            <DataTable
              columns={myCourseColumns}
              data={courses}
              searchColumn="name"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
