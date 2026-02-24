"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { user } from "@/types/types";
import { DataTable } from "@/components/data-table";
import { createColumns } from "./columns";
import { Users, UserPlus, UserMinus, UserCheck } from "lucide-react";
const fetchAssignedUsers = async (sectionId: string) => {
  const res = await fetch(`/api/sections/${sectionId}/users`);
  return res.json();
};
const fetchUnassignedUsers = async (sectionId: string) => {
  const res = await fetch(`/api/sections/${sectionId}/users?unassigned=true`);
  return res.json();
};
const assignUserToSection = async (sectionId: string, userId: string) => {
  const res = await fetch(`/api/sections/${sectionId}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return res.json();
};
const unassignUserFromSection = async (sectionId: string, userId: string) => {
  const res = await fetch(`/api/sections/${sectionId}/users`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return res.json();
};
export default function SectionUsersPage() {
  const params = useParams();
  const sectionId = params?.id as string;
  const [assignedUsers, setAssignedUsers] = useState<user[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<user[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssignedUsers, setSelectedAssignedUsers] = useState<user[]>(
    []
  );
  const [selectedUnassignedUsers, setSelectedUnassignedUsers] = useState<
    user[]
  >([]);
  const fetchData = async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const [assigned, unassigned] = await Promise.all([
        fetchAssignedUsers(sectionId),
        fetchUnassignedUsers(sectionId),
      ]);
      setAssignedUsers(assigned.data || []);
      setUnassignedUsers(unassigned.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [sectionId]);
  const handleAssign = async (userId: string) => {
    if (!sectionId) return;
    setLoading(true);
    try {
      await assignUserToSection(sectionId, userId);
      await fetchData();
    } catch (error) {
      console.error("Error assigning user:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleUnassign = async (userId: string) => {
    if (!sectionId) return;
    setLoading(true);
    try {
      await unassignUserFromSection(sectionId, userId);
      await fetchData();
    } catch (error) {
      console.error("Error unassigning user:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleBulkAssign = async () => {
    if (!sectionId || selectedUnassignedUsers.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        selectedUnassignedUsers.map((user) =>
          assignUserToSection(sectionId, user.id)
        )
      );
      await fetchData();
      setSelectedUnassignedUsers([]);
    } catch (error) {
      console.error("Error bulk assigning users:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleBulkUnassign = async () => {
    if (!sectionId || selectedAssignedUsers.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        selectedAssignedUsers.map((user) =>
          unassignUserFromSection(sectionId, user.id)
        )
      );
      await fetchData();
      setSelectedAssignedUsers([]);
    } catch (error) {
      console.error("Error bulk unassigning users:", error);
    } finally {
      setLoading(false);
    }
  };
  const assignedColumns = createColumns(
    fetchData,
    true,
    undefined,
    handleUnassign
  );
  const unassignedColumns = createColumns(
    fetchData,
    false,
    handleAssign,
    undefined
  );
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Section User Management</h1>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>Assigned: {assignedUsers.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <UserPlus className="h-4 w-4" />
            <span>Available: {unassignedUsers.length}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-green-700">
                Assigned Users ({assignedUsers.length})
              </h2>
            </div>
            {selectedAssignedUsers.length > 0 && (
              <Button
                onClick={handleBulkUnassign}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                disabled={loading}
              >
                <UserMinus className="h-4 w-4 mr-1" />
                Remove Selected ({selectedAssignedUsers.length})
              </Button>
            )}
          </div>
          <div className="border rounded-lg">
            <DataTable
              columns={assignedColumns}
              data={assignedUsers}
              searchColumn="name"
              onRowSelectionChange={setSelectedAssignedUsers}
            />
          </div>
        </div>
        {}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-blue-700">
                Available Users ({unassignedUsers.length})
              </h2>
            </div>
            {selectedUnassignedUsers.length > 0 && (
              <Button
                onClick={handleBulkAssign}
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700"
                disabled={loading}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Assign Selected ({selectedUnassignedUsers.length})
              </Button>
            )}
          </div>
          <div className="border rounded-lg">
            <DataTable
              columns={unassignedColumns}
              data={unassignedUsers}
              searchColumn="name"
              onRowSelectionChange={setSelectedUnassignedUsers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
