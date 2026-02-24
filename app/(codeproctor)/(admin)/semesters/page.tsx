"use client";
import { DataTable } from "@/components/data-table";
import { createSemesterColumns } from "./columns";
import { semester } from "@/types/types";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
export default function SemestersPage() {
  const [data, setData] = useState<semester[]>([]);
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
  const [newSemester, setNewSemester] = useState({ name: "", year: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSemester, setEditSemester] = useState<semester | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
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
      const semesters = await fetch(`/api/semesters?${params.toString()}`);
      const departments = await fetch(`/api/departments/all`);
      if (!departments.ok) {
        toast("Failed to fetch departments");
        throw new Error("Failed to fetch departments");
      }
      const deptRes = await departments.json();
      console.log(deptRes);
      setDepartments(deptRes.data || []);
      if (!semesters.ok) {
        toast("Failed to fetch semesters");
        throw new Error("Failed to fetch semesters");
      }
      const res = await semesters.json();
      setData(res.data || []);
      setTotalRows(res.total || 0);
      setTotalPages(res.totalPages || 0);
      console.log(res);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }
  async function refetchData(): Promise<void> {
    await getData();
  }
  async function handleCreateSemester(): Promise<void> {
    if (
      selectedSemester === "" ||
      selectedDepartment === "" ||
      newSemester.year.trim() === ""
    ) {
      toast("Please select a semester, department, and enter the year");
      return;
    }
    const selectedDept = departments.find(
      (dept: any) => dept.id === selectedDepartment
    );
    const selectedDeptName = selectedDept ? selectedDept.name : "";
    if (!selectedDeptName) {
      toast("Department not found. Please try again.");
      return;
    }
    const generatedSemesterName = `${newSemester.year}-Semester-${selectedSemester}-${selectedDeptName}`;
    setCreateLoading(true);
    try {
      const response = await fetch("/api/semesters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: generatedSemesterName,
          year: newSemester.year.trim(),
          department_id: selectedDepartment,
        }),
      });
      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewSemester({ name: "", year: "" });
        setSelectedDepartment("");
        setSelectedSemester("");
        toast("Semester created successfully!");
        await refetchData();
      } else {
        const error = await response.json();
        toast(`Failed to create semester: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating semester:", error);
      toast("Failed to create semester");
    } finally {
      setCreateLoading(false);
    }
  }
  async function handleEditSemester(): Promise<void> {
    if (!editSemester?.name.trim() || !String(editSemester?.year).trim()) {
      toast("Please enter both semester name and year");
      return;
    }
    setEditLoading(true);
    try {
      const response = await fetch("/api/semesters", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editSemester.id,
          name: editSemester.name.trim(),
          year: String(editSemester.year).trim(),
          dept_id: editSemester.dept_id,
        }),
      });
      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditSemester(null);
        toast("Semester updated successfully!");
        await refetchData();
      } else {
        const error = await response.json();
        toast(`Failed to update semester: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating semester:", error);
      toast("Failed to update semester");
    } finally {
      setEditLoading(false);
    }
  }
  function openEditDialog(semester: semester): void {
    setEditSemester({ ...semester });
    setIsEditDialogOpen(true);
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Semester Management
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Semester
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Semester</DialogTitle>
              <DialogDescription>
                {`Add a new semester to the system. Click save when you're done.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Semester
                </Label>
                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Year
                </Label>
                <Input
                  id="year"
                  value={newSemester.year}
                  onChange={(e) =>
                    setNewSemester((prev) => ({
                      ...prev,
                      year: e.target.value,
                    }))
                  }
                  className="col-span-3"
                  placeholder="Enter year (e.g., 2024)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department
                </Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {}
              {selectedSemester && selectedDepartment && newSemester.year && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm text-muted-foreground">
                    Preview:
                  </Label>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {newSemester.year}-Semester-{selectedSemester}-
                    {departments.find((d) => d.id === selectedDepartment)
                      ?.name || ""}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewSemester({ name: "", year: "" });
                  setSelectedDepartment("");
                  setSelectedSemester("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleCreateSemester}
                disabled={createLoading}
              >
                {createLoading ? "Creating..." : "Create Semester"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border bg-card shadow-sm">
        <DataTable
          columns={createSemesterColumns(refetchData, openEditDialog)}
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
      {}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
            <DialogDescription>
              {`Update the semester information. Click save when you're done.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editSemester?.name || ""}
                onChange={(e) =>
                  setEditSemester((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                className="col-span-3"
                placeholder="Enter semester name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-year" className="text-right">
                Year
              </Label>
              <Input
                id="edit-year"
                value={String(editSemester?.year || "")}
                onChange={(e) =>
                  setEditSemester((prev) =>
                    prev ? { ...prev, year: e.target.value } : null
                  )
                }
                className="col-span-3"
                placeholder="Enter year (e.g., 2024)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditSemester(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleEditSemester}
              disabled={editLoading}
            >
              {editLoading ? "Updating..." : "Update Semester"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
