import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getHackathonById, getUserRole, getTeamForUser } from "@/repository/hackathon.repository";
import { createSubmission, getSubmissionByTeam } from "@/repository/submission.repository";
import { storage } from "@/lib/storage";
import { emitEvent } from "@/lib/events";
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: hackathonId } = await params;
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const hackathon = await getHackathonById(hackathonId);
        if (!hackathon) {
            return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
        }
        if (hackathon.status !== "ACTIVE") {
             const now = new Date();
             const start = new Date(hackathon.start_date);
             const end = new Date(hackathon.end_date);
             if (hackathon.status === "PUBLISHED" && now >= start && now <= end) {
             } else {
                 return NextResponse.json({ error: "Hackathon is not active" }, { status: 400 });
             }
        }
        const team = await getTeamForUser(hackathonId, user.id);
        if (!team) {
            return NextResponse.json(
                { error: "You must be part of a team to submit" },
                { status: 403 }
            );
        }
        const role = await getUserRole(hackathonId, user.id);
        if (role !== "PARTICIPANT") {
            return NextResponse.json({ error: "Only participants can submit" }, { status: 403 });
        }
        const formData = await request.formData();
        const repoUrl = formData.get("repo_url") as string;
        const file = formData.get("ppt_file") as File;
        if (!repoUrl) {
            return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
        }
        if (!file) {
            return NextResponse.json({ error: "PPT file is required" }, { status: 400 });
        }
        if (!file.name.endsWith(".pptx") && !file.name.endsWith(".ppt") && !file.name.endsWith(".pdf")) {
        }
        const ext = file.name.split('.').pop() || "pptx";
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const objectKey = `hackio/hackathons/${hackathonId}/teams/${team.id}/submission/${timestamp}_${safeFileName}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await storage.uploadFile(objectKey, buffer, file.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation");
        const submission = await createSubmission({
            hackathon_id: hackathonId,
            team_id: team.id,
            repo_url: repoUrl,
            ppt_object_key: objectKey,
            status: "SUBMITTED"
        });
        await emitEvent("submission.submitted", {
            submission_id: submission.id,
            hackathon_id: hackathonId,
            team_id: team.id,
            user_id: user.id
        });
        return NextResponse.json({ success: true, submission });
    } catch (error: any) {
        console.error("Submission error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
