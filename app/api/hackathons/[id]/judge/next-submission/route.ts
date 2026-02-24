import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNextSubmissionToJudge } from "@/repository/evaluation.repository";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: hackathonId } = await params;
        const nextSubmissionId = await getNextSubmissionToJudge(hackathonId, session.user.id);

        return NextResponse.json({ nextSubmissionId });
    } catch (error) {
        console.error("Error fetching next submission:", error);
        return NextResponse.json({ error: "Failed to fetch next submission" }, { status: 500 });
    }
}
