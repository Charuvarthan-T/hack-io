
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    findUserByEmail,
    getTeamForUser,
    joinTeam,
    getUserRole,
    getTeamMemberCount,
    getHackathonById
} from "@/repository/hackathon.repository";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: hackathonId } = await params;
    const requesterId = session.user.id;

    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. Get Requester's Team
        const requesterTeam = await getTeamForUser(hackathonId, requesterId);
        if (!requesterTeam) {
            return NextResponse.json({ error: "You are not in a team" }, { status: 400 });
        }

        // 2. Check Permission (Only Team Creator? Or any member? For now, allow any member)
        // If strict: if (requesterTeam.created_by !== requesterId) ...

        // 3. Find Target User
        const targetUser = await findUserByEmail(email);
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (targetUser.id === requesterId) {
            return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
        }

        // 4. Verify Target User is a Participant
        const targetRole = await getUserRole(hackathonId, targetUser.id);
        if (targetRole !== 'PARTICIPANT') {
            return NextResponse.json({ error: "User must join the hackathon first" }, { status: 400 });
        }

        // 5. Verify Target User is NOT in a team
        const targetUserTeam = await getTeamForUser(hackathonId, targetUser.id);
        if (targetUserTeam) {
            return NextResponse.json({ error: "User is already in a team" }, { status: 400 });
        }

        // 6. Verify Team Size Limit
        const hackathon = await getHackathonById(hackathonId);
        const currentCount = await getTeamMemberCount(requesterTeam.id);

        if (currentCount >= (hackathon?.max_team_size || 4)) {
            return NextResponse.json({ error: "Team is full" }, { status: 400 });
        }

        // 7. Add Member
        await joinTeam(requesterTeam.id, targetUser.id);

        return NextResponse.json({ success: true, message: "Member added" });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
