import { NextResponse } from "next/server";
import sql from "@/lib/db";
export async function GET() {
    try {
        console.log("Initializing Hack.io RBAC Schema...");
        await sql`
      CREATE TABLE IF NOT EXISTS hackathons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        created_by UUID NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        await sql`
      CREATE TABLE IF NOT EXISTS hackathon_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('ORGANIZER', 'PARTICIPANT', 'JUDGE', 'MENTOR')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(hackathon_id, user_id)
      );
    `;
        await sql`
      CREATE INDEX IF NOT EXISTS idx_hackathon_participants_lookup
      ON hackathon_participants(hackathon_id, user_id);
    `;
        console.log("Schema initialization successful.");
        return NextResponse.json({ success: true, message: "Hack.io RBAC tables created." });
    } catch (error) {
        console.error("Schema initialization failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
