import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { ReactNode } from "react";
interface DashboardLayoutProps {
  children: ReactNode;
  admin: ReactNode;
  faculty: ReactNode;
  student: ReactNode;
  judge: ReactNode;
}
export default async function DashboardLayout({
  children,
  admin,
  faculty,
  student,
  judge,
}: DashboardLayoutProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }
  if (user.role === "admin") {
    return <>{admin}</>;
  }
  if (user.role === "faculty") {
    return <>{faculty}</>;
  }
  if (user.role === "student") {
    return <>{student}</>;
  }
  if (user.role === "judge") {
    return <>{judge}</>;
  }
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">
          Your role ({user.role}) does not have access to the dashboard.
        </p>
      </div>
    </div>
  );
}
