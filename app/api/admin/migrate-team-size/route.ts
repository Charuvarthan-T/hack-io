import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
export async function GET(req: NextRequest) {
    try {
        await sql`
            ALTER TABLE hackathons
            ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 4;
        `;
        return NextResponse.json({ success: true, message: "Migration complete: added max_team_size" });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
