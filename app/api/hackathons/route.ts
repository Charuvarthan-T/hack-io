
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createHackathon } from "@/repository/hackathon.repository";
import { addParticipant } from "@/repository/hackathon.repository";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Global Check: Only Admin/Faculty can create hackathons (CodeProctor logic)
  if (session.user.role !== "admin" && session.user.role !== "faculty") {
    return NextResponse.json({ error: "Global Permission Denied" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Create the event
    const hackathon = await createHackathon({
      ...body,
      created_by: session.user.id,
      start_date: new Date(body.start_date),
      end_date: new Date(body.end_date)
    });

    // Assign Creator as ORGANIZER
    // This is the bootstrap step for the RBAC system
    await addParticipant(hackathon.id, session.user.id, "ORGANIZER");

    return NextResponse.json(hackathon);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Basic query - fetch all for now.
    // In real app, might filter by user.
    const hackathons = await import("@/lib/db").then(mod => mod.default`SELECT * FROM hackathons ORDER BY created_at DESC`);
    return NextResponse.json(hackathons);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
