import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAssignedHackathonsForJudge } from "@/repository/evaluation.repository";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const hackathons = await getAssignedHackathonsForJudge(session.user.id);

        return NextResponse.json({ hackathons });
    } catch (error) {
        console.error("Error fetching judge hackathons:", error);
        return NextResponse.json({ error: "Failed to fetch hackathons" }, { status: 500 });
    }
}
