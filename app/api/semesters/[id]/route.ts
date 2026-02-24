import { getSemesterById } from "@/repository/semester.repository";
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest, {params}:{params:{id:string}}) {
    const { id } = await params;
    console.log(id);
    const semester = await getSemesterById(id);
    return NextResponse.json(semester, { status: 200 });
}
