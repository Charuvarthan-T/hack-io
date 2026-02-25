"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLoading from "../loading";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Target,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  Calendar,
  Building2,
  Users,
} from "lucide-react";
import SkillRadarChart from "@/components/skill-radar-chart";
interface Course {
  id: string;
  name: string;
  section_name: string;
  semester_name: string;
  section_id: string;
  total_problems: number;
  solved_problems: number;
}
interface StudentInfo {
  section: {
    section_id: string;
    section_name: string;
    semester_name: string;
    year: string;
    department_name: string;
  } | null;
}
interface DashboardData {
  student_info: StudentInfo;
  courses: Course[];
  statistics: {
    problems_solved: number;
    problems_attempted: number;
    total_available: number;
  };
}
const quickActions = [
  {
    title: "Browse Problems",
    description: "Explore and solve coding problems",
    href: "/problems",
    icon: FileText,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    title: "My Courses",
    description: "View your enrolled courses",
    href: "/my-courses",
    icon: BookOpen,
    iconColor: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    title: "Code Editor",
    description: "Practice coding and test solutions",
    href: "/editor",
    icon: GraduationCap,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
];
export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/student_dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Failed to fetch dashboard data");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
        console.error("Error fetching student dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const { data: session } = useSession();
  const user = session?.user;

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  const statsCards = data
    ? [
      {
        title: "Problems Solved",
        value: data.statistics.problems_solved,
        icon: CheckCircle,
        color: "text-green-600",
      },
      {
        title: "Total Attempted",
        value: data.statistics.problems_attempted,
        icon: Target,
        color: "text-blue-600",
      },
      {
        title: "Available Problems",
        value: data.statistics.total_available,
        icon: FileText,
        color: "text-purple-600",
      },
    ]
    : [];
  const solveRate =
    data && data.statistics.total_available > 0
      ? Math.round(
        (data.statistics.problems_solved / data.statistics.total_available) *
        100
      )
      : 0;
  return (
    <div className="space-y-8 p-6">
      { }
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}! 🎓
          </h1>
          <p className="text-muted-foreground mt-2">
            {data?.student_info.section
              ? `${data.student_info.section.section_name} • ${data.student_info.section.semester_name} • ${data.student_info.section.department_name}`
              : "Ready to start your coding journey?"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group inline-flex h-9 items-center justify-center overflow-hidden rounded-full border border-blue-500/30 bg-blue-500/10 px-4 shadow-sm transition-colors hover:bg-blue-500/20">
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent animate-[shimmer_2.5s_infinite]"></span>
            <span className="flex items-center gap-2 relative z-10 text-blue-700 dark:text-blue-400 font-semibold text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <GraduationCap className="h-4 w-4" />
              Student Dashboard
            </span>
          </div>
        </div>
      </div>
      { }
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1">
          <SkillRadarChart />
        </div>
        <div className="w-full xl:w-[350px] space-y-4">
          { }
        </div>
      </div>
      { }
      {data && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Your Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {statsCards.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="hover:scale-[1.02] hover:shadow-lg transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={stat.value} duration={1200} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      { }
      {data?.student_info.section && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Current Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Section:</span>
                <span>{data.student_info.section.section_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Semester:</span>
                <span>{data.student_info.section.semester_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Department:</span>
                <span>{data.student_info.section.department_name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      { }
      {data && data.courses.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            My Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {data.courses.map((course, index) => {
              const progressPercentage =
                course.total_problems > 0
                  ? (course.solved_problems / course.total_problems) * 100
                  : 0;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-[box-shadow,transform] duration-200 hover:-translate-y-1"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {course.name}
                    </CardTitle>
                    <CardDescription>
                      {course.section_name} • {course.semester_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <Progress value={progressPercentage} />
                    </div>
                    <Button
                      asChild
                      className="w-full"
                      variant="outline"
                      size="sm"
                    >
                      <Link
                        href={`/my-courses/${course.id}/problems`}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Problems
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      { }
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-6 w-6" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-[box-shadow,transform] duration-200 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.bgColor}`}>
                        <IconComponent
                          className={`h-6 w-6 ${action.iconColor}`}
                        />
                      </div>
                      <CardTitle className="text-lg leading-none m-0">{action.title}</CardTitle>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild className="w-full" variant="outline">
                    <Link href={action.href}>Go to {action.title}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      { }
      {data && data.courses.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 mt-4 text-center border-2 border-dashed rounded-xl bg-muted/10 hover:bg-muted/30 transition-colors">
          <div className="bg-primary/10 p-5 rounded-full mb-5">
            <BookOpen className="h-10 w-10 text-primary opacity-80" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Courses Enrolled</h3>
          <p className="text-muted-foreground max-w-sm">
            Once you are enrolled in courses by your instructors, they will automatically appear here. Looks like it's time to take a restful break for now! ☕
          </p>
        </div>
      )}
    </div>
  );
}
