import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
interface Judge {
  id: string;
  name: string;
  email: string;
}
interface AssignJudgesDialogProps {
  hackathonId: string;
  trigger?: React.ReactNode;
  initialAssigned?: string[];
  onAssigned?: (ids: string[]) => void;
}
export function AssignJudgesDialog({ hackathonId, trigger, initialAssigned = [], onAssigned }: AssignJudgesDialogProps) {
  const [open, setOpen] = useState(false);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [selected, setSelected] = useState<string[]>(initialAssigned);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      fetch(`/api/hackathons/${hackathonId}/judges`)
        .then(res => res.json())
        .then(data => setJudges(data.judges || []));
    }
  }, [open, hackathonId]);
  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/judges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgeIds: selected })
      });
      if (!res.ok) throw new Error("Failed to assign judges");
      toast.success("Judges assigned successfully");
      setOpen(false);
      onAssigned?.(selected);
    } catch (e: any) {
      toast.error(e.message || "Error assigning judges");
    } finally {
      setLoading(false);
    }
  };
  const toggleJudge = (id: string) => {
    setSelected(sel => sel.includes(id) ? sel.filter(j => j !== id) : [...sel, id]);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>Assign Judges</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Judges</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {judges.length === 0 && <div>No judges available.</div>}
          {judges.map(judge => (
            <div key={judge.id} className="flex items-center gap-2">
              <Checkbox checked={selected.includes(judge.id)} onCheckedChange={() => toggleJudge(judge.id)} />
              <Label>{judge.name || judge.email}</Label>
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={loading} className="mt-4 w-full">
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
