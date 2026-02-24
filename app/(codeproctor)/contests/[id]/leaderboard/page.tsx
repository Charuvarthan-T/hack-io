"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Medal, Award, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  problems_solved: number;
  total_points: number;
}
export default function ContestLeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const [contest, setContest] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchLeaderboardData();
  }, [contestId]);
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const [contestRes, leaderboardRes] = await Promise.all([
        fetch(`/api/contests/${contestId}`),
        fetch(`/api/contests/${contestId}/leaderboard`),
      ]);
      if (!contestRes.ok) throw new Error("Failed to fetch contest");
      const contestData = await contestRes.json();
      setContest(contestData.contest);
      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <User className="h-5 w-5 text-muted-foreground" />;
    }
  };
  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    return "outline";
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading leaderboard...</div>
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
  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);
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
      {}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{contest.title}</CardTitle>
          {contest.description && (
            <CardDescription>{contest.description}</CardDescription>
          )}
        </CardHeader>
      </Card>
      {}
      {topThree.length > 0 && (
        <div className="mb-8">
          <div className="flex items-end justify-center gap-4 mb-8">
            {}
            {topThree[1] && (
              <Card className="w-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-400">
                <CardContent className="pt-6 text-center">
                  <Medal className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <div className="text-4xl font-bold mb-2">2nd</div>
                  <div className="font-semibold text-lg mb-1">{topThree[1].name}</div>
                  <Badge variant="secondary" className="mb-2">
                    {topThree[1].total_points} pts
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {topThree[1].problems_solved} problems solved
                  </div>
                </CardContent>
              </Card>
            )}
            {}
            {topThree[0] && (
              <Card className="w-52 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-950 border-2 border-yellow-500">
                <CardContent className="pt-6 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-3 text-yellow-500" />
                  <div className="text-5xl font-bold mb-2">1st</div>
                  <div className="font-semibold text-xl mb-1">{topThree[0].name}</div>
                  <Badge className="mb-2 bg-yellow-500">
                    {topThree[0].total_points} pts
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {topThree[0].problems_solved} problems solved
                  </div>
                </CardContent>
              </Card>
            )}
            {}
            {topThree[2] && (
              <Card className="w-48 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-950 border-2 border-orange-600">
                <CardContent className="pt-6 text-center">
                  <Award className="h-12 w-12 mx-auto mb-3 text-orange-600" />
                  <div className="text-4xl font-bold mb-2">3rd</div>
                  <div className="font-semibold text-lg mb-1">{topThree[2].name}</div>
                  <Badge variant="secondary" className="mb-2">
                    {topThree[2].total_points} pts
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {topThree[2].problems_solved} problems solved
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      {}
      <Card>
        <CardHeader>
          <CardTitle>Full Leaderboard</CardTitle>
          <CardDescription>
            {leaderboard.length === 0
              ? "No submissions yet"
              : `${leaderboard.length} participants`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No submissions yet. Be the first to participate!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Problems Solved</TableHead>
                  <TableHead className="text-right">Total Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => (
                  <TableRow key={`${entry.user_id}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                        <Badge variant={getRankBadgeVariant(entry.rank)}>
                          #{entry.rank}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell className="text-center">
                      {entry.problems_solved}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {entry.total_points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {}
      <div className="mt-6 flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/contests/${contestId}/take`)}
        >
          View Contest
        </Button>
        <Button variant="outline" onClick={fetchLeaderboardData}>
          Refresh Leaderboard
        </Button>
      </div>
    </div>
  );
}
