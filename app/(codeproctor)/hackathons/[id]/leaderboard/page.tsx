"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Medal, Award, User, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
interface LeaderboardEntry {
  submission_id: string;
  team_name: string;
  team_id: string;
  final_average_score: number;
  judge_count: number;
}
export default function HackathonLeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;
  const [hackathon, setHackathon] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const [hackRes, leaderboardRes] = await Promise.all([
        fetch(`/api/hackathons/${hackathonId}`),
        fetch(`/api/hackathons/${hackathonId}/leaderboard`),
      ]);
      if (!hackRes.ok) throw new Error("Failed to fetch hackathon");
      setHackathon(await hackRes.json());
      if (leaderboardRes.ok) {
          const data = await leaderboardRes.json();
          setLeaderboard(data.leaderboard || []);
      } else {
          const err = await leaderboardRes.json();
          if (leaderboardRes.status === 403) {
              toast.info(err.error || "Leaderboard is currently hidden");
          } else {
              toast.error("Failed to load leaderboard");
          }
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (hackathonId) fetchLeaderboardData();
  }, [hackathonId]);
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-600" />;
      default: return <User className="h-5 w-5 text-muted-foreground" />;
    }
  };
  if (loading) return <div className="flex justify-center items-center h-screen text-lg">Loading leaderboard...</div>;
  if (!hackathon) return <div className="flex justify-center items-center h-screen text-lg">Hackathon not found</div>;
  return (
    <div className="container mx-auto py-10 space-y-8">
      <Button variant="ghost" onClick={() => router.push(`/hackathons/${hackathonId}`)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Hackathon
      </Button>
      <div className="flex flex-col items-center text-center space-y-2">
          <Badge variant="secondary" className="mb-2">Leaderboard</Badge>
          <h1 className="text-4xl font-bold">{hackathon.title}</h1>
          <p className="text-muted-foreground max-w-2xl">{hackathon.description}</p>
          <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="px-3 py-1">Phase: {hackathon.phase}</Badge>
          </div>
      </div>
      {leaderboard.length === 0 ? (
          <Card className="max-w-md mx-auto">
              <CardContent className="py-20 text-center space-y-4">
                  <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <Users className="text-muted-foreground h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                      <h3 className="font-semibold text-xl">No Scores Yet</h3>
                      <p className="text-muted-foreground">The evaluation phase is still in progress or no submissions have been graded.</p>
                  </div>
              </CardContent>
          </Card>
      ) : (
          <div className="space-y-8">
              {}
              <div className="flex flex-wrap justify-center items-end gap-4 pb-8">
                  {leaderboard[1] && (
                      <Card className="w-64 order-2 md:order-1 h-fit bg-secondary/20 border-2 border-gray-400">
                           <CardHeader className="text-center pb-2">
                               <Medal className="h-10 w-10 mx-auto text-gray-400" />
                               <div className="text-3xl font-bold">2nd</div>
                           </CardHeader>
                           <CardContent className="text-center">
                               <h3 className="font-bold text-xl truncate">{leaderboard[1].team_name}</h3>
                               <p className="text-2xl font-mono font-bold text-primary mt-2">{Number(leaderboard[1].final_average_score).toFixed(1)}</p>
                               <p className="text-xs text-muted-foreground mt-1">from {leaderboard[1].judge_count} judges</p>
                           </CardContent>
                      </Card>
                  )}
                  {leaderboard[0] && (
                      <Card className="w-72 order-1 md:order-2 bg-primary/10 border-2 border-yellow-500 shadow-xl scale-110">
                           <CardHeader className="text-center pb-2">
                               <Trophy className="h-16 w-16 mx-auto text-yellow-500 drop-shadow-lg" />
                               <div className="text-4xl font-black">1st</div>
                           </CardHeader>
                           <CardContent className="text-center pb-8">
                               <h3 className="font-bold text-2xl truncate">{leaderboard[0].team_name}</h3>
                               <p className="text-4xl font-mono font-black text-primary mt-2">{Number(leaderboard[0].final_average_score).toFixed(1)}</p>
                               <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-widest">Supreme Champion</p>
                               <p className="text-xs text-muted-foreground mt-1">from {leaderboard[0].judge_count} judges</p>
                           </CardContent>
                      </Card>
                  )}
                  {leaderboard[2] && (
                      <Card className="w-64 order-3 md:order-3 h-fit bg-secondary/20 border-2 border-orange-600">
                           <CardHeader className="text-center pb-2">
                               <Award className="h-10 w-10 mx-auto text-orange-600" />
                               <div className="text-3xl font-bold">3rd</div>
                           </CardHeader>
                           <CardContent className="text-center">
                               <h3 className="font-bold text-xl truncate">{leaderboard[2].team_name}</h3>
                               <p className="text-2xl font-mono font-bold text-primary mt-2">{Number(leaderboard[2].final_average_score).toFixed(1)}</p>
                               <p className="text-xs text-muted-foreground mt-1">from {leaderboard[2].judge_count} judges</p>
                           </CardContent>
                      </Card>
                  )}
              </div>
              {}
              <Card>
                  <CardHeader>
                      <CardTitle>Detailed Rankings</CardTitle>
                      <CardDescription>Average scores across all evaluation criteria</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-20 text-center">Rank</TableHead>
                                  <TableHead>Team Name</TableHead>
                                  <TableHead className="text-center">Judges</TableHead>
                                  <TableHead className="text-right">Average Score</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {leaderboard.map((entry, index) => (
                                  <TableRow key={entry.submission_id}>
                                      <TableCell className="text-center font-bold">
                                          <div className="flex items-center justify-center gap-2">
                                              {getRankIcon(index + 1)}
                                              <span>#{index + 1}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell className="font-semibold">{entry.team_name}</TableCell>
                                      <TableCell className="text-center">{entry.judge_count}</TableCell>
                                      <TableCell className="text-right">
                                          <Badge className="font-mono text-lg px-3 py-1 bg-primary text-primary-foreground">
                                              {Number(entry.final_average_score).toFixed(2)}
                                          </Badge>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </div>
      )}
    </div>
  );
}
