
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
    deleteHackathon, 
    getHackathonById, 
    updateHackathonStatus, 
    getUserRole, 
    getTeamForUser 
} from "@/repository/hackathon.repository";

// GET: Fetch Hackathon Details + User Context
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const userId = session?.user?.id;

    try {
        // 1. Get Hackathon Details
        const hackathon = await getHackathonById(id);
        if (!hackathon) {
            return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
        }

        // 2. Get User Context (if logged in)
        let userStatus = {
            role: null as string | null,
            team: null as any
        };

        if (userId) {
            const role = await getUserRole(id, userId);
            const team = await getTeamForUser(id, userId);
            userStatus = { role, team };
        }

        return NextResponse.json({
            ...hackathon,
            user_status: userStatus
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// PATCH: Update Hackathon Status
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // 1. Get Params
    const body = await req.json();
    const { status } = body;

    if (!status) {
        return NextResponse.json({ error: "Status required" }, { status: 400 });
    }

    // 2. Permission Check (Admin or Organizer)
    let canEdit = false;
    if (session.user.role === "admin") {
        canEdit = true;
    } else {
        const role = await getUserRole(id, session.user.id);
        if (role === "ORGANIZER") {
            canEdit = true;
        }
    }

    if (!canEdit) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // 3. Update
    try {
        const updated = await updateHackathonStatus(id, status);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// DELETE: Remove Hackathon
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Check if Hackathon exists
    const hackathon = await getHackathonById(id);
    if (!hackathon) {
        return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    // 2. Permission Check
    // Allow if Global Admin OR if Contextual Organizer
    let canDelete = false;

    if (session.user.role === "admin") {
        canDelete = true;
    } else {
        const role = await getUserRole(id, session.user.id);
        if (role === "ORGANIZER") {
            canDelete = true;
        }
    }

    if (!canDelete) {
        return NextResponse.json(
            { error: "Permission denied. Only Admins or Organizers can delete this event." },
            { status: 403 }
        );
    }

    try {
        await deleteHackathon(id);
        return NextResponse.json({ success: true, message: "Hackathon deleted" });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
