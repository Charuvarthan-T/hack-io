import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserPoints } from "@/repository/user.repository";
export async function GET() {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  try {
    const points = await getUserPoints(user.id);
    return NextResponse.json({ points });
  } catch (e) {
    console.error('Error fetching user points:', e);
    return NextResponse.json({ points: 0 }, { status: 500 });
  }
}
