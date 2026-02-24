"use client";
import { DataTable } from "@/components/data-table";
import { createCourseColumns } from "./columns";
import { course } from "@/types/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
export default function CoursesPage() {
  const [data, setData] = useState<course[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 7,
  });
  const [sorting, setSorting] = useState<any[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<course | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<course | null>(null);
  useEffect(() => {
    getData();
  }, [pagination, sorting, globalFilter]);
  async function getData(): Promise<void> {
    setLoading(true);
    try {
      const sortBy = sorting.length > 0 ? sorting[0].id : "id";
      const sortOrder = sorting.length > 0 && sorting[0].desc ? "desc" : "asc";
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        pageSize: pagination.pageSize.toString(),
        search: globalFilter,
        sortBy,
        sortOrder,
      });
      const courses = await fetch(`/api/courses?${params.toString()}`);
      if (!courses.ok) {
        throw new Error("Failed to fetch courses");
      }
      const res = await courses.json();
      setData(res.data);
      setTotalRows(res.total);
      setTotalPages(res.totalPages);
      console.log(res);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }
  async function refetchData(): Promise<void> {
    await getData();
  }
  async function handleCreateCourse(): Promise<void> {
    if (!newCourseName.trim()) {
      toast.error("Please enter a course name");
      return;
    }
    setCreateLoading(true);
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCourseName.trim() }),
      });
      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewCourseName("");
        await refetchData();
        toast.success("Course created successfully");
      } else {
        const error = await response.json();
        toast.error(
          `Failed to create course: ${error.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Failed to create course");
    } finally {
      setCreateLoading(false);
    }
  }
  async function handleEditCourse(): Promise<void> {
    if (!editCourse?.name.trim()) {
      toast.error("Please enter a course name");
      return;
    }
    setEditLoading(true);
    try {
      const response = await fetch("/api/courses", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editCourse.id,
          name: editCourse.name.trim(),
        }),
      });
      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditCourse(null);
        await refetchData();
        toast.success("Course updated successfully");
      } else {
        const error = await response.json();
        toast.error(
          `Failed to update course: ${error.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course");
    } finally {
      setEditLoading(false);
    }
  }
  function openEditDialog(course: course): void {
    setEditCourse({ ...course });
    setIsEditDialogOpen(true);
  }
  function openDeleteDialog(course: course): void {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  }
  async function handleDeleteCourse(): Promise<void> {
    if (!courseToDelete) return;
    try {
      const response = await fetch(`/api/courses?id=${courseToDelete.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await refetchData();
        toast.success("Course deleted successfully");
      } else {
        const error = await response.json();
        toast.error(
          `Failed to delete course: ${error.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Course Management
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                {`Add a new course to the system. Click save when you're done.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter course name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewCourseName("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleCreateCourse}
                disabled={createLoading}
              >
                {createLoading ? "Creating..." : "Create Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border bg-card shadow-sm">
        <DataTable
          columns={createCourseColumns(
            refetchData,
            openEditDialog,
            openDeleteDialog
          )}
          data={data}
          searchColumn="name"
          manualPagination={true}
          manualSorting={true}
          manualFiltering={true}
          pageCount={totalPages}
          rowCount={totalRows}
          state={{
            pagination,
            sorting,
            globalFilter,
          }}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          onGlobalFilterChange={setGlobalFilter}
          loading={loading}
        />
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              {`Update the course information. Click save when you're done.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editCourse?.name || ""}
                onChange={(e) =>
                  setEditCourse((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                className="col-span-3"
                placeholder="Enter course name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditCourse(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleEditCourse}
              disabled={editLoading}
            >
              {editLoading ? "Updating..." : "Update Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Course"
        description={`Are you sure you want to delete the course "${courseToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteCourse}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
