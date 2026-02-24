"use client";
import { course } from "@/types/types";
import { ArrowUpDown, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { AssignProblemsDialog } from "@/components/assign-problems-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
const ActionCell = ({ course }: { course: course }) => {
  const { data: session } = useSession();
  const user = session?.user;
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="h-8"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Problems
      </Button>
      <AssignProblemsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={course.id}
        courseName={course.name}
      />
    </>
  );
};
const ActionsDropdown = ({ course }: { course: course }) => {
  const router = useRouter();
  const handleViewProblems = () => {
    router.push(`/my-courses/${course.id}/problems`);
  };
  const handleCopyCourseId = () => {
    navigator.clipboard.writeText(course.id);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleCopyCourseId}>
          Copy course ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleViewProblems}>
          View Problems
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export const createCourseColumns = (userRole: string) => {
  const myCourseColumns: ColumnDef<course>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Course ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Course Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "section_name",
      header: "Section",
    },
    {
      accessorKey: "semester_name",
      header: "Semester",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const course = row.original;
        return (
          <div className="flex justify-between">
            <ActionsDropdown course={course} />
            {userRole !== "student" && <ActionCell course={course} />}
          </div>
        );
      },
    },
  ];
  return myCourseColumns;
};
