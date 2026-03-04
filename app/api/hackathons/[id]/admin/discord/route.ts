import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateHackathonDiscordSettings, getHackathonById, getUserRole } from "@/repository/hackathon.repository";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const body = await req.json();
        const hackathon = await getHackathonById(id);
        if (!hackathon) {
            return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
        }
        
        
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
             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const updated = await updateHackathonDiscordSettings(id, body);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating discord settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
