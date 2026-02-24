"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Clock, CheckCircle2, Circle, Code, Trophy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
interface Problem {
  id: string;
  title: string;
  description: string;
  points: number;
  order_index: number | null;
  is_solved?: boolean;
}
export default function TakeContestPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const [contest, setContest] = useState<any>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  useEffect(() => {
    fetchContestData();
  }, [contestId]);
  useEffect(() => {
    if (!contest) return;
    const interval = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);
    return () => clearInterval(interval);
  }, [contest]);
  const fetchContestData = async () => {
    try {
      setLoading(true);
      const [contestRes, problemsRes, submissionsRes] = await Promise.all([
        fetch(`/api/contests/${contestId}`),
        fetch(`/api/contests/${contestId}/problems`),
        fetch(`/api/contests/${contestId}/submissions`),
      ]);
      if (!contestRes.ok) throw new Error("Failed to fetch contest");
      const contestData = await contestRes.json();
      setContest(contestData.contest);
      if (problemsRes.ok) {
        const problemsData = await problemsRes.json();
        setProblems(problemsData.problems || []);
      }
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.submissions || []);
      }
    } catch (error) {
      console.error("Error fetching contest data:", error);
      toast.error("Failed to load contest");
    } finally {
      setLoading(false);
    }
  };
  const calculateTimeRemaining = () => {
    if (!contest) return;
    const now = new Date();
    const endTime = new Date(contest.end_time);
    const diff = endTime.getTime() - now.getTime();
    if (diff <= 0) {
      setTimeRemaining("Contest Ended");
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeRemaining(`${minutes}m ${seconds}s`);
    }
  };
  const isProblemSolved = (problemId: string) => {
    return submissions.some((s) => s.problem_id === problemId && s.is_solved);
  };
  const getTotalPoints = () => {
    return submissions
      .filter((s) => s.is_solved)
      .reduce((sum, s) => sum + (s.points_earned || 0), 0);
  };
  const getSolvedCount = () => {
    return submissions.filter((s) => s.is_solved).length;
  };
  const handleSolveProblem = (problemId: string) => {
    router.push(`/contests/${contestId}/problems/${problemId}`);
  };
  const isContestActive = () => {
    if (!contest) return false;
    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    return now >= startTime && now <= endTime;
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
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading contest...</div>
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
  const active = isContestActive();
  return (
    <div className="container mx-auto py-10">
      <Button
        variant="ghost"
        onClick={() => router.push("/contests")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Contests
      </Button>
      <div className="grid gap-6 lg:grid-cols-3">
        {}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{contest.title}</CardTitle>
                  {contest.description && (
                    <CardDescription>{contest.description}</CardDescription>
                  )}
                </div>
                <Badge variant={active ? "default" : "secondary"}>
                  {active ? "Active" : timeRemaining === "Contest Ended" ? "Ended" : "Not Started"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Start Time</p>
                  <p className="font-medium">{formatDate(contest.start_time)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Time</p>
                  <p className="font-medium">{formatDate(contest.end_time)}</p>
                </div>
                {contest.duration_minutes && (
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{contest.duration_minutes} minutes</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Total Problems</p>
                  <p className="font-medium">{problems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Problems</CardTitle>
              <CardDescription>
                {active
                  ? "Select a problem to start solving"
                  : "Contest is not currently active"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {problems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No problems available
                </div>
              ) : (
                <div className="space-y-3">
                  {problems.map((problem, index) => {
                    const solved = isProblemSolved(problem.id);
                    return (
                      <div
                        key={problem.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                          solved
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {solved ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {index + 1}. {problem.title}
                              </span>
                              <Badge variant="outline">{problem.points} pts</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {problem.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSolveProblem(problem.id)}
                          disabled={!active}
                          variant={solved ? "outline" : "default"}
                        >
                          <Code className="h-4 w-4 mr-2" />
                          {solved ? "Review" : "Solve"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {}
              {active && (
                <div className="text-center p-4 bg-accent rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Time Remaining</span>
                  </div>
                  <div className="text-3xl font-bold">{timeRemaining}</div>
                </div>
              )}
              <Separator />
              {}
              <div className="space-y-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-muted-foreground text-sm mb-1">Total Points</div>
                  <div className="text-4xl font-bold text-primary">
                    {getTotalPoints()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">
                      {getSolvedCount()}
                    </div>
                    <div className="text-xs text-muted-foreground">Solved</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {problems.length - getSolvedCount()}
                    </div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>
                {}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {problems.length > 0
                        ? Math.round((getSolvedCount() / problems.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          problems.length > 0
                            ? (getSolvedCount() / problems.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              {}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/contests/${contestId}/leaderboard`)}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  View Leaderboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={fetchContestData}
                >
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
