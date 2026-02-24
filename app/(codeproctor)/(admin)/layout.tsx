import { LayoutProps } from "@/.next/types/app/layout";
import { AppHeader } from "@/components/app-header";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
export default async function AdminLayout({ children }: LayoutProps) {
    const user = await getAuthenticatedUser();
  if (user?.role !== "admin") {
    return (
      <div>
        <h1>Unauthorised Access. Prohibited entry into site.</h1>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col p-4">{children}</main>
    </div>
  );
}
