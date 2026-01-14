"use client";

import { use, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Code, CheckSquare, UploadCloud, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TaskList } from "@/components/team/task-list";

export default function TeamWorkspacePage({ params }: { params: Promise<{ id: string; teamId: string }> }) {
    // Unwrap params using use() hook or await if in async component, but this is client component.
    // In Next 15 client components, params is a promise but can be unwrapped with React.use() if needed,
    // or just accessed via useParams() hook which is easier for client components.

    const router = useRouter();
    const routerParams = useParams();
    const hackathonId = routerParams.id as string;
    const teamId = routerParams.teamId as string;

    const [activeTab, setActiveTab] = useState("overview");
    const [members, setMembers] = useState<any[]>([]);
    const [hackathonSettings, setHackathonSettings] = useState<any>(null);

    useEffect(() => {
        if (hackathonId) {
            // Fetch hackathon settings
            fetch(`/api/hackathons/${hackathonId}`)
                .then(res => res.json())
                .then(data => setHackathonSettings(data))
                .catch(err => console.error("Failed to fetch hackathon", err));
        }

        if (teamId) {
            fetch(`/api/hackathons/${hackathonId}/team/${teamId}/members`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setMembers(data);
                })
                .catch(err => console.error("Failed to fetch members", err));
        }
    }, [teamId, hackathonId]);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Workspace Header */}
            <div className="border-b bg-background p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/hackathons/${hackathonId}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">Team Workspace</h1>
                        <p className="text-xs text-muted-foreground">Hackathon ID: {hackathonId}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" /> Team Members
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <UploadCloud className="h-4 w-4 mr-2" /> Submit Project
                    </Button>
                </div>
            </div>

            {/* Workspace Content */}
            <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="border-b px-4">
                        <TabsList className="bg-transparent h-12">
                            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="tasks" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                <CheckSquare className="h-4 w-4 mr-2" /> Tasks
                            </TabsTrigger>
                            <TabsTrigger value="code" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                <Code className="h-4 w-4 mr-2" /> Code & IDE
                            </TabsTrigger>
                            <TabsTrigger value="chat" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                <MessageSquare className="h-4 w-4 mr-2" /> Team Chat
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 p-6 overflow-auto bg-muted/10">
                        <TabsContent value="overview" className="h-full m-0 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Welcome to your team workspace! Use the tabs above to manage your project.
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">No recent activity.</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Team Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center space-x-2 text-green-500">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                            <span className="text-sm font-medium">All Systems Go</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="tasks" className="h-full m-0">
                            <div className="h-full overflow-auto">
                                <TaskList members={members} />
                            </div>
                        </TabsContent>

                        <TabsContent value="code" className="h-full m-0">
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Collaborative IDE Integration (Coming Soon)
                            </div>
                        </TabsContent>

                        <TabsContent value="chat" className="h-full m-0">
                            {hackathonSettings?.discord_enabled ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <div className="bg-[#5865F2] text-white p-4 rounded-full">
                                        <MessageSquare className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Team Chat on Discord</h3>
                                    <p className="text-muted-foreground text-center max-w-md">
                                        Communication for this hackathon is hosted on Discord.
                                        Click below to access your team channel.
                                    </p>
                                    <Button
                                        className="bg-[#5865F2] hover:bg-[#4752C4]"
                                        onClick={() => {
                                            const link = hackathonSettings.discord_server_type === "INTERNAL"
                                                ? "https://discord.gg/BRwWs4Nj" // Official Hack.io Server
                                                : hackathonSettings.discord_invite_link;

                                            if (link) window.open(link, "_blank");
                                            else toast.error("Discord link is currently unavailable.");
                                        }}
                                    >
                                        Open Discord
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Team chat is not enabled for this hackathon.
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
