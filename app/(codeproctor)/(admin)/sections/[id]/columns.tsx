import { user } from "@/types/types";
import { ArrowUpDown, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
export const createColumns = (
  refetchData: () => Promise<void>,
  isAssigned: boolean = false,
  onAssign?: (userId: string) => Promise<void>,
  onUnassign?: (userId: string) => Promise<void>
): ColumnDef<user>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("role")}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;
      if (isAssigned && onUnassign) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUnassign(user.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Minus className="h-4 w-4 mr-1" />
            Remove
          </Button>
        );
      } else if (!isAssigned && onAssign) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssign(user.id)}
            className="text-green-600 hover:text-green-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Assign
          </Button>
        );
      }
      return null;
    },
  },
];
