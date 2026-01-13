
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Correct import per previous fix
import { addParticipant } from "@/repository/hackathon.repository";
import { RBACService } from "@/lib/rbac.service";
import { EventService } from "@/lib/event.service";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // Hackathon ID
    const userId = session.user.id;
    const globalRole = session.user.role || 'student';

    try {
        // 1. RBAC Validation (Deterministic Gate)
        await RBACService.validateJoinRequest(userId, id, globalRole);

        // 2. Execution
        await addParticipant(id, userId, "PARTICIPANT");

        // 3. Event Emission
        await EventService.emit('participant.joined', {
            hackathonId: id,
            userId: userId,
            timestamp: new Date()
        });

        return NextResponse.json({ success: true, message: "Joined hackathon successfully" });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
