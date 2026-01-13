
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTeam, getUserRole, getTeamForUser, CreateTeamDTO } from "@/repository/hackathon.repository";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: hackathonId } = await params;
    const userId = session.user.id;

    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: "Team name is required" }, { status: 400 });
        }

        // 1. Validation: User must be a PARTICIPANT
        const role = await getUserRole(hackathonId, userId);
        if (role !== 'PARTICIPANT') {
            return NextResponse.json({ error: "Only participants can create teams" }, { status: 403 });
        }

        // 2. Validation: User must NOT already be in a team
        const existingTeam = await getTeamForUser(hackathonId, userId);
        if (existingTeam) {
            return NextResponse.json({ error: "You are already in a team" }, { status: 400 });
        }

        // 3. Create Team
        const newTeam = await createTeam({
            hackathon_id: hackathonId,
            name: name,
            created_by: userId
        });

        return NextResponse.json(newTeam);

    } catch (error) {
        // Handle unique constraint error (Team Name duplicate)
        if (String(error).includes("violates unique constraint")) {
            return NextResponse.json({ error: "Team name already exists in this hackathon" }, { status: 409 });
        }
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
