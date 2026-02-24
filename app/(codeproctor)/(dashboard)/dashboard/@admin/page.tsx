"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  Users,
  BookOpen,
  Building2,
  GraduationCap,
  Calendar,
  FileText,
  Layout,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
type DashboardData = {
  n_courses: number;
  n_instructors: number;
  n_departments: number;
  n_users: number;
  n_problems: number;
  n_semesters: number;
  n_sections: number;
};
const adminPages = [
  {
    title: "Manage Users",
    description: "View and manage all users in the system",
    href: "/users",
    icon: Users,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    title: "Manage Courses",
    description: "Create and manage course offerings",
    href: "/courses",
    icon: BookOpen,
    iconColor: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    title: "Manage Departments",
    description: "Organize academic departments",
    href: "/departments",
    icon: Building2,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    title: "Manage Semesters",
    description: "Set up academic terms and schedules",
    href: "/semesters",
    icon: Calendar,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    title: "Manage Sections",
    description: "Configure course sections and enrollments",
    href: "/sections",
    icon: Layout,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
  },
  {
    title: "View Problems",
    description: "Browse and manage coding problems",
    href: "/problems",
    icon: FileText,
    iconColor: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
];
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/admin_dashboard");
      const json = await res.json();
      setData(json);
    };
    fetchData();
  }, []);
  const { data: session } = useSession();
  const user = session?.user;
  const statsCards = data
    ? [
        {
          title: "Total Users",
          value: data.n_users,
          icon: Users,
          color: "text-blue-600",
        },
        {
          title: "Total Courses",
          value: data.n_courses,
          icon: BookOpen,
          color: "text-green-600",
        },
        {
          title: "Total Departments",
          value: data.n_departments,
          icon: Building2,
          color: "text-purple-600",
        },
        {
          title: "Total Instructors",
          value: data.n_instructors,
          icon: GraduationCap,
          color: "text-orange-600",
        },
        {
          title: "Total Problems",
          value: data.n_problems,
          icon: FileText,
          color: "text-red-600",
        },
        {
          title: "Total Semesters",
          value: data.n_semesters,
          icon: Calendar,
          color: "text-indigo-600",
        },
        {
          title: "Total Sections",
          value: data.n_sections,
          icon: Layout,
          color: "text-pink-600",
        },
      ]
    : [];
  return (
    <div className="space-y-8 p-6">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening in your CodeProctor system today.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Admin Dashboard
        </Badge>
      </div>
      {}
      {data && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsCards.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stat.value.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Layout className="h-6 w-6" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminPages.map((page, index) => {
            const IconComponent = page.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${page.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${page.iconColor}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild className="w-full" variant="outline">
                    <Link href={page.href}>
                      Go to {page.title.split(" ")[1]}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
