"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

export default function AdminSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const hackathonId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [discordEnabled, setDiscordEnabled] = useState(false);

    const [serverType, setServerType] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL");
    const [inviteLink, setInviteLink] = useState("");
    const [categoryId, setCategoryId] = useState("");

    useEffect(() => {
        if (hackathonId) {
            fetchHackathon();
        }
    }, [hackathonId]);

    const fetchHackathon = async () => {
        try {
            const res = await fetch(`/api/hackathons/${hackathonId}`);
            if (res.ok) {
                const data = await res.json();
                setDiscordEnabled(data.discord_enabled || false);
                setServerType(data.discord_server_type || "INTERNAL");
                setInviteLink(data.discord_invite_link || "");
                setCategoryId(data.discord_category_id || "");
            }
        } catch (error) {
            console.error("Error fetching hackathon:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/hackathons/${hackathonId}/admin/discord`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    discord_enabled: discordEnabled,

                    discord_server_type: serverType,
                    discord_invite_link: inviteLink,
                    discord_category_id: categoryId
                }),
            });

            if (res.ok) {
                toast.success("Settings saved successfully");
            } else {
                toast.error("Failed to save settings");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h1 className="text-3xl font-bold">Hackathon Settings</h1>
                <p className="text-muted-foreground">Manage configuration for this event.</p>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Discord Integration</CardTitle>
                    <CardDescription>
                        Enable Discord integration to provide team chat channels for participants.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable Discord</Label>
                            <p className="text-sm text-muted-foreground">
                                Activate Discord features for this hackathon.
                            </p>
                        </div>
                        <Switch
                            checked={discordEnabled}
                            onCheckedChange={setDiscordEnabled}
                        />
                    </div>

                    {discordEnabled && (
                        <div className="space-y-6 animate-in slide-in-from-top-2">
                            <div className="space-y-3">
                                <Label>Server Configuration</Label>
                                <RadioGroup
                                    value={serverType}
                                    onValueChange={(v) => setServerType(v as "INTERNAL" | "EXTERNAL")}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    <div className="flex items-center space-x-2 border p-4 rounded-md cursor-pointer hover:bg-accent/50 [&:has(:checked)]:bg-accent [&:has(:checked)]:border-primary">
                                        <RadioGroupItem value="INTERNAL" id="internal" />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="internal" className="cursor-pointer">Use Hack.io Managed Server</Label>
                                            <p className="text-sm text-muted-foreground">
                                                We'll automatically create private channels under a specific category in our official Discord server.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-4 rounded-md cursor-pointer hover:bg-accent/50 [&:has(:checked)]:bg-accent [&:has(:checked)]:border-primary">
                                        <RadioGroupItem value="EXTERNAL" id="external" />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="external" className="cursor-pointer">Use Your Own Server</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Provide your own Discord server invite link.
                                            </p>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </div>

                            {serverType === "INTERNAL" && (
                                <div className="space-y-2">
                                    <Label htmlFor="category">Discord Category ID</Label>
                                    <Input
                                        id="category"
                                        placeholder="123456789012345678"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Enter the ID of the Category in the Hack.io Discord where channels should be created.
                                    </p>
                                </div>
                            )}

                            {serverType === "EXTERNAL" && (
                                <div className="space-y-2">
                                    <Label htmlFor="invite">Discord Invite Link</Label>
                                    <Input
                                        id="invite"
                                        placeholder="https://discord.gg/your-code"
                                        value={inviteLink}
                                        onChange={(e) => setInviteLink(e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Ensure the Hack.io bot is added to your server for automated channel management.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
