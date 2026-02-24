"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Minus,
  Users,
  BookOpen,
  FileText,
  Trash2,
} from "lucide-react";
interface Problem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  created_by: string;
  type?: string;
}
interface TestCase {
  input: string;
  output: string;
}
interface AssignProblemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
}
export function AssignProblemsDialog({
  open,
  onOpenChange,
  courseId,
  courseName,
}: AssignProblemsDialogProps) {
  const [assignedProblems, setAssignedProblems] = useState<Problem[]>([]);
  const [unassignedProblems, setUnassignedProblems] = useState<Problem[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<
    "unassigned" | "assigned" | "create"
  >("unassigned");
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
  });
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "", output: "" },
  ]);
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const assignedResponse = await fetch(
        `/api/courses/problems?courseId=${courseId}`
      );
      const assignedData = await assignedResponse.json();
      const unassignedResponse = await fetch(
        `/api/courses/problems?courseId=${courseId}&action=unassigned`
      );
      const unassignedData = await unassignedResponse.json();
      if (assignedData.success) {
        setAssignedProblems(assignedData.data || []);
      }
      if (unassignedData.success) {
        setUnassignedProblems(unassignedData.data || []);
      }
    } catch (error) {
      console.error("Error fetching problems:", error);
      toast.error("Failed to load problems");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (open && courseId) {
      fetchProblems();
      setSelectedProblems([]);
      setCreateForm({ title: "", description: "" });
      setTestCases([{ input: "", output: "" }]);
    }
  }, [open, courseId]);
  const handleProblemSelection = (problemId: string, checked: boolean) => {
    if (checked) {
      setSelectedProblems((prev) => [...prev, problemId]);
    } else {
      setSelectedProblems((prev) => prev.filter((id) => id !== problemId));
    }
  };
  const handleAssignProblems = async () => {
    if (selectedProblems.length === 0) {
      toast.error("Please select at least one problem to assign");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/courses/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          problemIds: selectedProblems,
          action: "assign-multiple",
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        setSelectedProblems([]);
        await fetchProblems();
        setActiveView("assigned");
      } else {
        toast.error(result.message || "Failed to assign problems");
      }
    } catch (error) {
      console.error("Error assigning problems:", error);
      toast.error("Failed to assign problems");
    } finally {
      setSubmitting(false);
    }
  };
  const handleUnassignProblem = async (problemId: string) => {
    try {
      const response = await fetch("/api/courses/problems", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          problemId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Problem unassigned successfully");
        await fetchProblems();
      } else {
        toast.error(result.message || "Failed to unassign problem");
      }
    } catch (error) {
      console.error("Error unassigning problem:", error);
      toast.error("Failed to unassign problem");
    }
  };
  const handleDeleteProblem = async (
    problemId: string,
    problemTitle: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete the problem "${problemTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/courses/${courseId}/problems`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Course-specific problem deleted successfully");
        await fetchProblems();
      } else {
        toast.error(result.error || "Failed to delete problem");
      }
    } catch (error) {
      console.error("Error deleting problem:", error);
      toast.error("Failed to delete problem");
    }
  };
  const addTestCase = () => {
    setTestCases([...testCases, { input: "", output: "" }]);
  };
  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };
  const updateTestCase = (
    index: number,
    field: "input" | "output",
    value: string
  ) => {
    const updatedTestCases = testCases.map((testCase, i) =>
      i === index ? { ...testCase, [field]: value } : testCase
    );
    setTestCases(updatedTestCases);
  };
  const handleCreateProblem = async () => {
    if (!createForm.title.trim()) {
      toast.error("Problem title is required");
      return;
    }
    if (!createForm.description.trim()) {
      toast.error("Problem description is required");
      return;
    }
    const validTestCases = testCases.filter(
      (tc) => tc.input.trim() && tc.output.trim()
    );
    if (validTestCases.length === 0) {
      toast.error("At least one valid test case is required");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/problems`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          testCases: validTestCases,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Course-specific problem created successfully");
        setCreateForm({ title: "", description: "" });
        setTestCases([{ input: "", output: "" }]);
        await fetchProblems();
        setActiveView("assigned");
      } else {
        toast.error(result.error || "Failed to create problem");
      }
    } catch (error) {
      console.error("Error creating problem:", error);
      toast.error("Failed to create problem");
    } finally {
      setSubmitting(false);
    }
  };
  const ProblemCard = ({
    problem,
    isAssigned,
    showCheckbox,
  }: {
    problem: Problem;
    isAssigned: boolean;
    showCheckbox: boolean;
  }) => (
    <div className="flex items-start space-x-3 p-4 border rounded-lg bg-card">
      {showCheckbox && (
        <Checkbox
          checked={selectedProblems.includes(problem.id)}
          onCheckedChange={(checked) =>
            handleProblemSelection(problem.id, checked as boolean)
          }
          className="mt-1"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold truncate">{problem.title}</h4>
          <div className="flex items-center space-x-2 ml-2">
            {problem.type === "course-specific" && (
              <Badge variant="default" className="text-xs">
                Course-Specific
              </Badge>
            )}
            {isAssigned &&
              (problem.type === "course-specific" ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteProblem(problem.id, problem.title)}
                  className="h-6 w-6 p-0"
                  title="Delete course-specific problem"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUnassignProblem(problem.id)}
                  className="h-6 w-6 p-0"
                  title="Unassign problem"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {problem.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>By: {problem.created_by}</span>
          <span>{new Date(problem.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-60px h-100px">
        <DialogHeader>
          <DialogTitle>Manage Problems Dialog</DialogTitle>
          <DialogDescription>
            Assign existing problems or create course-specific problems with
            test cases
          </DialogDescription>
        </DialogHeader>
        {}
        <div className="flex space-x-1 p-1 bg-muted rounded-lg mb-4">
          <button
            onClick={() => setActiveView("unassigned")}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "unassigned"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Available ({unassignedProblems.length})</span>
          </button>
          <button
            onClick={() => setActiveView("assigned")}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "assigned"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Assigned ({assignedProblems.length})</span>
          </button>
          <button
            onClick={() => setActiveView("create")}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "create"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Create New</span>
          </button>
        </div>
        {}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading problems...</span>
            </div>
          ) : activeView === "create" ? (
            <div className="space-y-6 h-96 overflow-y-auto pr-2">
              {}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Problem Title *</Label>
                  <Input
                    id="title"
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, title: e.target.value })
                    }
                    placeholder="Enter problem title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Problem Description *</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the problem requirements, constraints, and examples"
                    className="min-h-[100px]"
                  />
                </div>
                {}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Test Cases *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTestCase}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Test Case
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {testCases.map((testCase, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-muted/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Test Case {index + 1}
                          </span>
                          {testCases.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTestCase(index)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Input</Label>
                            <Textarea
                              value={testCase.input}
                              onChange={(e) =>
                                updateTestCase(index, "input", e.target.value)
                              }
                              placeholder="Test input"
                              className="h-20 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Expected Output</Label>
                            <Textarea
                              value={testCase.output}
                              onChange={(e) =>
                                updateTestCase(index, "output", e.target.value)
                              }
                              placeholder="Expected output"
                              className="h-20 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 overflow-y-auto">
              <div className="space-y-3 pr-2">
                {activeView === "unassigned" ? (
                  unassignedProblems.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No problems available to assign
                      </p>
                    </div>
                  ) : (
                    unassignedProblems.map((problem) => (
                      <ProblemCard
                        key={problem.id}
                        problem={problem}
                        isAssigned={false}
                        showCheckbox={true}
                      />
                    ))
                  )
                ) : assignedProblems.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No problems assigned to this course yet
                    </p>
                  </div>
                ) : (
                  assignedProblems.map((problem) => (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      isAssigned={true}
                      showCheckbox={false}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {activeView === "unassigned" && selectedProblems.length > 0 && (
              <span>{selectedProblems.length} problem(s) selected</span>
            )}
            {activeView === "create" && (
              <span>Create a new problem specific to this course</span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {activeView === "unassigned" && (
              <Button
                onClick={handleAssignProblems}
                disabled={selectedProblems.length === 0 || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Selected ({selectedProblems.length})
                  </>
                )}
              </Button>
            )}
            {activeView === "create" && (
              <Button onClick={handleCreateProblem} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Problem
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
