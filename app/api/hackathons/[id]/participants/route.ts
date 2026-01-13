
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removeHackathonParticipant } from "@/repository/hackathon.repository";
import { RBACService } from "@/lib/rbac.service";
import { EventService } from "@/lib/event.service";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // Hackathon ID
    const requesterId = session.user.id;
    const requesterGlobalRole = session.user.role || 'student';

    try {
        const { targetUserId } = await req.json();

        if (!targetUserId) {
            return NextResponse.json({ error: "Target User ID required" }, { status: 400 });
        }

        // 1. RBAC Validation (Deterministic Gate)
        const canRemove = await RBACService.validateRemovalRequest(requesterId, id, targetUserId, requesterGlobalRole);

        if (!canRemove) {
            return NextResponse.json({ error: "Removal request denied by RBAC (Insufficient Permission)" }, { status: 403 });
        }

        // 2. Execution
        await removeHackathonParticipant(id, targetUserId);

        // 3. Event Emission
        await EventService.emit('participant.removed', {
            hackathonId: id,
            userId: targetUserId,
            removedBy: requesterId,
            timestamp: new Date()
        });

        return NextResponse.json({ success: true, message: "Participant removed successfully" });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { getUserRole, getHackathonParticipants } = await import("@/repository/hackathon.repository");

    // RBAC: Organizer, Admin, Judge, Mentor
    let canView = false;
    if (session.user.role === 'admin') canView = true;
    else {
        const role = await getUserRole(id, session.user.id);
        if (role === 'ORGANIZER' || role === 'JUDGE' || role === 'MENTOR') canView = true;
    }

    if (!canView) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    try {
        const participants = await getHackathonParticipants(id);
        return NextResponse.json(participants);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
