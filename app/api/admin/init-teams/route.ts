import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        // 1. Create hackathon_teams
        await sql`
      CREATE TABLE IF NOT EXISTS hackathon_teams (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        hackathon_id UUID REFERENCES hackathons(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(hackathon_id, name)
      )
    `;

        // 2. Create hackathon_team_members
        await sql`
      CREATE TABLE IF NOT EXISTS hackathon_team_members (
        team_id UUID REFERENCES hackathon_teams(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (team_id, user_id)
      )
    `;

        return NextResponse.json({ success: true, message: "Team tables created" });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
