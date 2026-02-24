import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const { id } = await params;
    const userId = session.user.id;
    const globalRole = session.user.role || 'student';
    try {
        await RBACService.validateJoinRequest(userId, id, globalRole);
        await addParticipant(id, userId, "PARTICIPANT");
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
