"use client";
import { ColumnDef } from "@tanstack/react-table";
import { contest } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, FileText, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
export const columns: ColumnDef<contest>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("title")}</div>;
    },
  },
  {
    accessorKey: "created_by_name",
    header: "Created By",
  },
  {
    accessorKey: "start_time",
    header: "Start Time",
    cell: ({ row }) => {
      const date = new Date(row.getValue("start_time"));
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    },
  },
  {
    accessorKey: "end_time",
    header: "End Time",
    cell: ({ row }) => {
      const date = new Date(row.getValue("end_time"));
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    },
  },
  {
    accessorKey: "duration_minutes",
    header: "Duration",
    cell: ({ row }) => {
      const duration = row.getValue("duration_minutes") as number | null;
      return duration ? `${duration} mins` : "Unlimited";
    },
  },
  {
    accessorKey: "problem_count",
    header: "Problems",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {row.getValue("problem_count") || 0}
        </div>
      );
    },
  },
  {
    accessorKey: "section_count",
    header: "Sections",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          {row.getValue("section_count") || 0}
        </div>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const contest = row.original;
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [isDeleting, setIsDeleting] = useState(false);
      const handleDelete = async () => {
        setIsDeleting(true);
        try {
          const response = await fetch(`/api/contests/${contest.id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            toast.success("Contest deleted successfully");
            setIsDeleteDialogOpen(false);
            window.location.reload();
          } else {
            const error = await response.json();
            toast.error(error.error || "Failed to delete contest");
          }
        } catch (error) {
          console.error("Error deleting contest:", error);
          toast.error("Failed to delete contest");
        } finally {
          setIsDeleting(false);
        }
      };
      return (
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                window.location.href = `/contests/${contest.id}`;
              }}
              title="Edit Contest"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                window.location.href = `/contests/${contest.id}/leaderboard`;
              }}
              title="View Leaderboard"
            >
              <Trophy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              title="Delete Contest"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Contest</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{contest.title}"? This will remove all associated problems, sections, and submissions. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Contest"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    },
  },
];
