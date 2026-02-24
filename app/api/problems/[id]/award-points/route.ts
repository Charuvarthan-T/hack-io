import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { awardPointsForProblem } from "@/repository/problem.repository";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const body = await request.json();
  const points = typeof body.points === 'number' ? body.points : 0;
  if (!points || points <= 0) {
    return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
  }
  try {
    const result = await awardPointsForProblem(user.id, id, points);
    console.log('award-points result for user', user.id, 'problem', id, ':', result);
    return NextResponse.json({ success: true, awarded: result.awarded, totalPoints: result.totalPoints });
  } catch (error) {
    console.error('Error in award-points route:', error);
    return NextResponse.json({ error: 'Failed to award points', details: (error as any)?.message || String(error) }, { status: 500 });
  }
}
