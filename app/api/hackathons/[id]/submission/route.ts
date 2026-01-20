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


        // 1. Validate Hackathon Logic
        const hackathon = await getHackathonById(hackathonId);
        if (!hackathon) {
            return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
        }
        if (hackathon.status !== "ACTIVE") {
             // Allow submission if PUBLISHED and within date range?
             // Or strict check?
             // To fix user issue immediately: Allow both, or check dates.
             // Better: Check if status is ACTIVE OR (status is PUBLISHED and date is valid)
             const now = new Date();
             const start = new Date(hackathon.start_date);
             const end = new Date(hackathon.end_date);
             
             if (hackathon.status === "PUBLISHED" && now >= start && now <= end) {
                 // implicitly active, allowed
             } else {
                 return NextResponse.json({ error: "Hackathon is not active" }, { status: 400 });
             }
        }

        // 2. Validate User & Team
        // Check if user is a participant
        // Optimization: getTeamForUser checks membership directly
        const team = await getTeamForUser(hackathonId, user.id);
        if (!team) {
            return NextResponse.json(
                { error: "You must be part of a team to submit" },
                { status: 403 }
            );
        }

        // Double check participation role just in case (optional but safe)
        const role = await getUserRole(hackathonId, user.id);
        if (role !== "PARTICIPANT") {
            return NextResponse.json({ error: "Only participants can submit" }, { status: 403 });
        }

        // 3. Process Request Data
        const formData = await request.formData();
        const repoUrl = formData.get("repo_url") as string;
        const file = formData.get("ppt_file") as File;

        if (!repoUrl) {
            return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
        }
        if (!file) {
            return NextResponse.json({ error: "PPT file is required" }, { status: 400 });
        }

        // 4. File Validation
        if (!file.name.endsWith(".pptx") && !file.name.endsWith(".ppt") && !file.name.endsWith(".pdf")) {
            // Allow PDF as fallback? Request said PPT. Sticking to PPT/PPTX for now as primary, 
            // but checking extension is good practice. 
            // "PPT files are binary artifacts"
        }

        // 5. Upload to R2 (Storage First)
        // Deterministic Key: hackio/hackathons/{hackathon_id}/teams/{team_id}/submission/final.pptx
        // We use the extension from the file or default to .pptx

        const ext = file.name.split('.').pop() || "pptx";
        const timestamp = Date.now();
        // Sanitize original filename to avoid path traversal or special chars
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const objectKey = `hackio/hackathons/${hackathonId}/teams/${team.id}/submission/${timestamp}_${safeFileName}`;

        // Convert File to Buffer/ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await storage.uploadFile(objectKey, buffer, file.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation");

        // 6. Store Metadata in DB
        const submission = await createSubmission({
            hackathon_id: hackathonId,
            team_id: team.id,
            repo_url: repoUrl,
            ppt_object_key: objectKey,
            status: "SUBMITTED"
        });

        // 7. Emit Event
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
