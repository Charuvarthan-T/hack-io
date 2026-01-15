import { NextRequest, NextResponse } from "next/server";
import { getHackathonById } from "@/repository/hackathon.repository";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" });

    try {
        const hackathon = await getHackathonById(id);
        const now = new Date();
        return NextResponse.json({
            hackathon,
            serverTime: now,
            isActive: hackathon?.status === 'ACTIVE',
            checks: {
                statusCheck: hackathon?.status,
                // Add any other logic you want to inspect
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
