"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Trophy,
  Users,
  FileText,
  Clock,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { contest } from "@/types/types";
export default function ContestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const [contest, setContest] = useState<contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [availableProblems, setAvailableProblems] = useState<any[]>([]);
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [isAddProblemDialogOpen, setIsAddProblemDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState("");
  const [problemPoints, setProblemPoints] = useState("10");
  const [selectedSection, setSelectedSection] = useState("");
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    duration_minutes: "",
    is_active: false,
  });
  useEffect(() => {
    fetchContestData();
  }, [contestId]);
  const fetchContestData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchContest(),
        fetchProblems(),
        fetchSections(),
      ]);
    } finally {
      setLoading(false);
    }
  };
  const fetchContest = async () => {
    try {
      const response = await fetch(`/api/contests/${contestId}`);
      if (!response.ok) throw new Error("Failed to fetch contest");
      const data = await response.json();
      setContest(data.contest);
      if (data.contest) {
        setEditFormData({
          title: data.contest.title,
          description: data.contest.description || "",
          start_time: new Date(data.contest.start_time)
            .toISOString()
            .slice(0, 16),
          end_time: new Date(data.contest.end_time).toISOString().slice(0, 16),
          duration_minutes: data.contest.duration_minutes?.toString() || "",
          is_active: data.contest.is_active,
        });
      }
    } catch (error) {
      console.error("Error fetching contest:", error);
      toast.error("Failed to load contest");
    }
  };
  const fetchProblems = async () => {
    try {
      const response = await fetch(`/api/contests/${contestId}/problems`);
      if (!response.ok) throw new Error("Failed to fetch problems");
      const data = await response.json();
      setProblems(data.problems || []);
    } catch (error) {
      console.error("Error fetching problems:", error);
    }
  };
  const fetchSections = async () => {
    try {
      const response = await fetch(`/api/contests/${contestId}/sections`);
      if (!response.ok) throw new Error("Failed to fetch sections");
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };
  const fetchAvailableProblems = async () => {
    try {
      const response = await fetch(
        `/api/contests/${contestId}/problems?available=true`
      );
      if (!response.ok) throw new Error("Failed to fetch available problems");
      const data = await response.json();
      setAvailableProblems(data.problems || []);
    } catch (error) {
      console.error("Error fetching available problems:", error);
    }
  };
  const fetchAvailableSections = async () => {
    try {
      const response = await fetch(
        `/api/contests/${contestId}/sections?available=true`
      );
      if (!response.ok) throw new Error("Failed to fetch available sections");
      const data = await response.json();
      setAvailableSections(data.sections || []);
    } catch (error) {
      console.error("Error fetching available sections:", error);
    }
  };
  const handleAddProblem = async () => {
    if (!selectedProblem) {
      toast.error("Please select a problem");
      return;
    }
    try {
      const response = await fetch(`/api/contests/${contestId}/problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: selectedProblem,
          points: parseInt(problemPoints) || 10,
        }),
      });
      if (!response.ok) throw new Error("Failed to add problem");
      toast.success("Problem added to contest");
      setIsAddProblemDialogOpen(false);
      setSelectedProblem("");
      setProblemPoints("10");
      fetchProblems();
    } catch (error) {
      console.error("Error adding problem:", error);
      toast.error("Failed to add problem");
    }
  };
  const handleRemoveProblem = async (problemId: string) => {
    if (!confirm("Are you sure you want to remove this problem?")) return;
    try {
      const response = await fetch(
        `/api/contests/${contestId}/problems?problemId=${problemId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to remove problem");
      toast.success("Problem removed from contest");
      fetchProblems();
    } catch (error) {
      console.error("Error removing problem:", error);
      toast.error("Failed to remove problem");
    }
  };
  const handleAddSection = async () => {
    if (!selectedSection) {
      toast.error("Please select a section");
      return;
    }
    try {
      const response = await fetch(`/api/contests/${contestId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: selectedSection }),
      });
      if (!response.ok) throw new Error("Failed to add section");
      toast.success("Section added to contest");
      setIsAddSectionDialogOpen(false);
      setSelectedSection("");
      fetchSections();
    } catch (error) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
    }
  };
  const handleRemoveSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to remove this section?")) return;
    try {
      const response = await fetch(
        `/api/contests/${contestId}/sections?sectionId=${sectionId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to remove section");
      toast.success("Section removed from contest");
      fetchSections();
    } catch (error) {
      console.error("Error removing section:", error);
      toast.error("Failed to remove section");
    }
  };
  const handleUpdateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/contests/${contestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          duration_minutes: editFormData.duration_minutes
            ? parseInt(editFormData.duration_minutes)
            : null,
        }),
      });
      if (!response.ok) throw new Error("Failed to update contest");
      toast.success("Contest updated successfully");
      setIsEditDialogOpen(false);
      fetchContest();
    } catch (error) {
      console.error("Error updating contest:", error);
      toast.error("Failed to update contest");
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  if (!contest) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Contest not found</div>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/contests")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contests
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
            {contest.description && (
              <p className="text-muted-foreground mb-4">
                {contest.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <Badge variant={contest.is_active ? "default" : "secondary"}>
                {contest.is_active ? "Active" : "Inactive"}
              </Badge>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                }).format(new Date(contest.start_time))}
                {" - "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                }).format(new Date(contest.end_time))}
              </div>
              {contest.duration_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {contest.duration_minutes} minutes
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/contests/${contestId}/leaderboard`)}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Button>
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Contest
            </Button>
          </div>
        </div>
      </div>
      <Tabs defaultValue="problems" className="w-full">
        <TabsList>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>
        <TabsContent value="problems">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Problems</CardTitle>
                  <CardDescription>
                    Manage problems for this contest
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    fetchAvailableProblems();
                    setIsAddProblemDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Problem
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {problems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No problems added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {problems.map((problem) => (
                    <div
                      key={problem.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{problem.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {problem.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{problem.points} points</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProblem(problem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>
                    Manage sections assigned to this contest
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    fetchAvailableSections();
                    setIsAddSectionDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sections assigned yet
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">Section {section.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {section.semester_name}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {}
      <Dialog
        open={isAddProblemDialogOpen}
        onOpenChange={setIsAddProblemDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Problem to Contest</DialogTitle>
            <DialogDescription>
              Select a problem from the list below
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Problem</Label>
              <Select value={selectedProblem} onValueChange={setSelectedProblem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a problem" />
                </SelectTrigger>
                <SelectContent>
                  {availableProblems.map((problem) => (
                    <SelectItem key={problem.id} value={problem.id}>
                      {problem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Points</Label>
              <Input
                type="number"
                min="1"
                value={problemPoints}
                onChange={(e) => setProblemPoints(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddProblemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddProblem}>Add Problem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {}
      <Dialog
        open={isAddSectionDialogOpen}
        onOpenChange={setIsAddSectionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Section to Contest</DialogTitle>
            <DialogDescription>
              Select a section from the list below
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      Section {section.name} - {section.semester_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddSectionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSection}>Add Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleUpdateContest}>
            <DialogHeader>
              <DialogTitle>Edit Contest</DialogTitle>
              <DialogDescription>
                Update contest details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-start">Start Time</Label>
                  <Input
                    id="edit-start"
                    type="datetime-local"
                    value={editFormData.start_time}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        start_time: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-end">End Time</Label>
                  <Input
                    id="edit-end"
                    type="datetime-local"
                    value={editFormData.end_time}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        end_time: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="1"
                  value={editFormData.duration_minutes}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      duration_minutes: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Active</Label>
                <Switch
                  id="edit-active"
                  checked={editFormData.is_active}
                  onCheckedChange={(checked) =>
                    setEditFormData({ ...editFormData, is_active: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Contest</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
