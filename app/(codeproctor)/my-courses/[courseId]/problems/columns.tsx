"use client";
import { problem } from "@/types/types";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteProblem } from "@/repository/problem.repository";
import { useState } from "react";
import { toast } from "sonner";
const ActionsDropdown = ({
  problem,
  userRole,
  row,
  refetch,
}: {
  problem: problem;
  userRole: string;
  row: any;
  refetch: () => Promise<void>;
}) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const handleView = () => {
    router.push(`/problems/${problem.id}`);
  };
  const handleEdit = () => {
    router.push(`/problems/${problem.id}/edit`);
  };
  async function handleDelete() {
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsDeleteDialogOpen(false);
        await refetch();
        toast.success("Problem deleted successfully");
      } else {
        console.error("Failed to delete problem");
        toast.error("Failed to delete problem");
      }
    } catch (error) {
      console.error("Error deleting problem:", error);
      toast.error("An error occurred while deleting the problem");
    }
  }
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };
  const handleCopyId = () => {
    navigator.clipboard.writeText(problem.id);
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleCopyId}>
            Copy problem ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            View Problem
          </DropdownMenuItem>
          {userRole !== "student" && (
            <>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Problem
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Problem
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Problem"
        description={`Are you sure you want to delete "${problem.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
};
export const createCourseProblemColumns = (
  userRole: string,
  fetchCourseProblems: () => Promise<void>
) => {
  const courseProblemsColumns: ColumnDef<problem>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Problem ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "solved_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("solved_status") as string;
        if (status === "solved") {
          return (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
            >
              Solved
            </Badge>
          );
        } else if (status === "attempted") {
          return (
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
            >
              Attempted
            </Badge>
          );
        } else {
          return <Badge variant="outline">Unsolved</Badge>;
        }
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <div className="max-w-[300px] truncate" title={description}>
            {description}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return date ? (
          <div className="text-sm">{new Date(date).toLocaleDateString()}</div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const problem = row.original;
        return (
          <ActionsDropdown
            problem={problem}
            userRole={userRole}
            row={row}
            refetch={fetchCourseProblems}
          />
        );
      },
    },
  ];
  return courseProblemsColumns;
};
