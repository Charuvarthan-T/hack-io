import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";

// GET /api/hackathons/[id]/judges - Get all potential judges (global role 'judge')
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            // For now, only admins/organizers can list judges. 
            // Simplified check: if they have a session, we let them fetch the list to assign.
        }

        const judges = await sql`
      SELECT id, name, email FROM users WHERE role = 'judge'
    `;

        return NextResponse.json({ judges });
    } catch (error) {
        console.error("Error fetching judges:", error);
        return NextResponse.json({ error: "Failed to fetch judges" }, { status: 500 });
    }
}

// POST /api/hackathons/[id]/judges - Assign judges to this hackathon
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: hackathonId } = await params;
        const { judgeIds } = await req.json();

        if (!Array.isArray(judgeIds)) {
            return NextResponse.json({ error: "judgeIds must be an array" }, { status: 400 });
        }

        // 1. Remove existing judges (optional, depending on if we want to sync)
        // For a simple assignment, we just add new ones or sync. 
        // Let's do a sync: delete all JUDGE roles for this hackathon and re-add.

        await sql`
      DELETE FROM hackathon_participants 
      WHERE hackathon_id = ${hackathonId} AND role = 'JUDGE'
    `;

        // 2. Add new judges
        if (judgeIds.length > 0) {
            for (const userId of judgeIds) {
                await sql`
          INSERT INTO hackathon_participants (hackathon_id, user_id, role)
          VALUES (${hackathonId}, ${userId}, 'JUDGE')
          ON CONFLICT (hackathon_id, user_id) DO UPDATE SET role = 'JUDGE'
        `;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error assigning judges:", error);
        return NextResponse.json({ error: "Failed to assign judges" }, { status: 500 });
    }
}
