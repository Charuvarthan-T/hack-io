
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// ... imports
import { deleteHackathon, getHackathonById, updateHackathonStatus } from "@/repository/hackathon.repository";
import { getUserRole } from "@/repository/hackathon.repository";

// ... DELETE method

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

    // 2. Permission Check (Same logic as DELETE: Admin or Organizer)
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
