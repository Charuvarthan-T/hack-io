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
import {
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  Calendar,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
interface Course {
  id: string;
  name: string;
  section_name: string;
  semester_name: string;
}
interface DashboardData {
  courses: Course[];
  statistics: {
    n_courses: number;
    n_sections: number;
    n_students: number;
    n_problems: number;
  };
  recent_activity?: {
    id: string;
    created_at: string;
    status: string;
    student_name: string;
    problem_title: string;
    course_name: string;
  }[];
}
const quickActions = [
  {
    title: "View All Problems",
    description: "Browse and manage coding problems",
    href: "/problems",
    icon: FileText,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    title: "My Courses",
    description: "Manage your assigned courses",
    href: "/my-courses",
    icon: BookOpen,
    iconColor: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    title: "Code Editor",
    description: "Test and create code solutions",
    href: "/editor",
    icon: GraduationCap,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
];
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "accepted":
    case "correct":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "wrong answer":
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "pending":
    case "running":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};
const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "accepted":
    case "correct":
      return "default";
    case "wrong answer":
    case "failed":
      return "destructive";
    case "pending":
    case "running":
      return "secondary";
    default:
      return "outline";
  }
};
export default function FacultyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/faculty_dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Failed to fetch dashboard data");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
        console.error("Error fetching faculty dashboard data:", err);
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
        title: "My Courses",
        value: data.statistics.n_courses,
        icon: BookOpen,
        color: "text-blue-600",
      },
      {
        title: "Sections",
        value: data.statistics.n_sections,
        icon: Users,
        color: "text-green-600",
      },
      {
        title: "Students",
        value: data.statistics.n_students,
        icon: GraduationCap,
        color: "text-purple-600",
      },
      {
        title: "Problems",
        value: data.statistics.n_problems,
        icon: FileText,
        color: "text-orange-600",
      },
    ]
    : [];
  return (
    <div className="space-y-8 p-6">
      { }
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's an overview of your courses and recent activity.
          </p>
        </div>
        <div className="relative group inline-flex h-9 items-center justify-center overflow-hidden rounded-full border border-orange-500/30 bg-orange-500/10 px-4 shadow-sm transition-colors hover:bg-orange-500/20">
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent animate-[shimmer_2.5s_infinite]"></span>
          <span className="flex items-center gap-2 relative z-10 text-orange-700 dark:text-orange-400 font-semibold text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <GraduationCap className="h-4 w-4" />
            Faculty Dashboard
          </span>
        </div>
      </div>
      { }
      {data && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Your Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      {data && data.courses.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            My Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {data.courses.map((course, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-[box-shadow,transform] duration-200 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <BookOpen className="h-6 w-6 text-blue-600" />
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
                <CardContent className="pt-0 space-y-2">
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
            ))}
          </div>
        </div>
      )}
      { }
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
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
          <h3 className="text-xl font-semibold mb-2">No Courses Assigned</h3>
          <p className="text-muted-foreground max-w-sm">
            You don't have any courses assigned yet. Once your administrator assigns a course to you, it will show up right here! 📚
          </p>
        </div>
      )}
    </div>
  );
}
