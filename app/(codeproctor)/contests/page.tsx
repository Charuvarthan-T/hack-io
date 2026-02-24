"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Trophy,
  FileText,
  Play,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { contest } from "@/types/types";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
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
import { Switch } from "@/components/ui/switch";
export default function ContestsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [contests, setContests] = useState<contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    duration_minutes: "",
    is_active: false,
  });
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "faculty";
  useEffect(() => {
    fetchContests();
  }, [isAdmin]);
  const fetchContests = async () => {
    try {
      setLoading(true);
      const url = isAdmin ? "/api/contests" : "/api/contests?forStudent=true";
      console.log("Fetching contests from:", url, "isAdmin:", isAdmin);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch contests");
      const data = await response.json();
      console.log("Contests received:", data);
      setContests(data || []);
    } catch (error) {
      console.error("Error fetching contests:", error);
      toast.error("Failed to load contests");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_time || !formData.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const response = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration_minutes: formData.duration_minutes
            ? parseInt(formData.duration_minutes)
            : null,
        }),
      });
      if (!response.ok) throw new Error("Failed to create contest");
      const data = await response.json();
      toast.success("Contest created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        duration_minutes: "",
        is_active: false,
      });
      router.push(`/contests/${data.contest.id}`);
    } catch (error) {
      console.error("Error creating contest:", error);
      toast.error("Failed to create contest");
    }
  };
  const getContestStatus = (contest: contest) => {
    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    if (now < startTime) return "upcoming";
    if (now > endTime) return "ended";
    return "active";
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>;
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "ended":
        return <Badge variant="outline">Ended</Badge>;
      default:
        return null;
    }
  };
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  const getProgressPercentage = (solved: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((solved / total) * 100);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading contests...</div>
      </div>
    );
  }
  if (isAdmin) {
    return (
      <div>
        <div className="flex items-center justify-between p-4">
          <div>
            <CardTitle className="text-3xl">Contests</CardTitle>
            <CardDescription>
              Manage coding contests and quizzes
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Contest
          </Button>
        </div>
        <DataTable columns={columns} data={contests}/>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleCreateContest}>
              <DialogHeader>
                <DialogTitle>Create New Contest</DialogTitle>
                <DialogDescription>
                  Create a new coding contest. You can add problems and assign
                  sections after creation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Midterm Coding Quiz"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the contest..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_time">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_time">
                      End Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration_minutes">
                    Duration (minutes)
                    <span className="text-muted-foreground text-sm ml-2">
                      (Optional - leave empty for unlimited)
                    </span>
                  </Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: e.target.value,
                      })
                    }
                    placeholder="e.g., 60"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Contest</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  const upcomingContests = contests.filter(
    (c) => getContestStatus(c) === "upcoming"
  );
  const activeContests = contests.filter(
    (c) => getContestStatus(c) === "active"
  );
  const endedContests = contests.filter((c) => getContestStatus(c) === "ended");
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Contests</h1>
        <p className="text-muted-foreground">
          View and participate in assigned coding contests
        </p>
      </div>
      {contests.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contests assigned to you yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {}
          {activeContests.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Play className="h-6 w-6 text-green-500" />
                Active Contests
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeContests.map((contest) => (
                  <Card
                    key={contest.id}
                    className="border-green-200 dark:border-green-900"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl">
                          {contest.title}
                        </CardTitle>
                        {getStatusBadge("active")}
                      </div>
                      {contest.description && (
                        <CardDescription className="line-clamp-2">
                          {contest.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Ends: {formatDate(contest.end_time)}</span>
                        </div>
                        {contest.duration_minutes && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{contest.duration_minutes} minutes</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{contest.problem_count || 0} problems</span>
                        </div>
                        {contest.solved_count !== undefined && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span className="font-medium">
                                {contest.solved_count}/
                                {contest.problem_count || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{
                                  width: `${getProgressPercentage(
                                    contest.solved_count,
                                    contest.problem_count || 0
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        <Button
                          className="w-full mt-2"
                          onClick={() =>
                            router.push(`/contests/${contest.id}/take`)
                          }
                        >
                          {contest.solved_count ? "Continue" : "Start Contest"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {}
          {upcomingContests.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-500" />
                Upcoming Contests
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingContests.map((contest) => (
                  <Card
                    key={contest.id}
                    className="border-blue-200 dark:border-blue-900"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl">
                          {contest.title}
                        </CardTitle>
                        {getStatusBadge("upcoming")}
                      </div>
                      {contest.description && (
                        <CardDescription className="line-clamp-2">
                          {contest.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Starts: {formatDate(contest.start_time)}</span>
                        </div>
                        {contest.duration_minutes && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{contest.duration_minutes} minutes</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{contest.problem_count || 0} problems</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {}
          {endedContests.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-gray-500" />
                Past Contests
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {endedContests.map((contest) => (
                  <Card key={contest.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl">
                          {contest.title}
                        </CardTitle>
                        {getStatusBadge("ended")}
                      </div>
                      {contest.description && (
                        <CardDescription className="line-clamp-2">
                          {contest.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Ended: {formatDate(contest.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{contest.problem_count || 0} problems</span>
                        </div>
                        {contest.solved_count !== undefined && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Your Score</span>
                              <span className="font-medium">
                                {contest.solved_count}/
                                {contest.problem_count || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                              <div
                                className="bg-gray-500 h-2 rounded-full"
                                style={{
                                  width: `${getProgressPercentage(
                                    contest.solved_count,
                                    contest.problem_count || 0
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              router.push(`/contests/${contest.id}/leaderboard`)
                            }
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            Results
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
