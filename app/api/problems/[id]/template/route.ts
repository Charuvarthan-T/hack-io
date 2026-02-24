import { getProblemTemplateByLanguage, getProblemTemplate, createOrUpdateProblemTemplate } from "@/repository/problem.repository";
import { requireAuth } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
    const {id} = await params;
    const {searchParams} = new URL(request.url);
    const language = searchParams.get('language');
    try {
        if (language) {
            const supportedLanguages = ['python', 'java', 'javascript', 'c', 'cpp'];
            if (!supportedLanguages.includes(language)) {
                return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
            }
            const templateCode = await getProblemTemplateByLanguage(id, language);
            return NextResponse.json({ templateCode });
        } else {
            const templates = await getProblemTemplate(id);
            return NextResponse.json({ templates });
        }
    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
    }
}
export async function PUT(request: Request, {params}: {params: Promise<{id: string}>}) {
    const user = await requireAuth();
    if (user instanceof NextResponse) {
        return user;
    }
    if (user.role !== "admin" && user.role !== "faculty") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const {id} = await params;
    const templates = await request.json();
    const allowedLanguages = ['python', 'java', 'javascript', 'c', 'cpp'];
    const validTemplates: any = {};
    for (const [lang, code] of Object.entries(templates)) {
        if (allowedLanguages.includes(lang) && typeof code === 'string') {
            validTemplates[lang] = code;
        }
    }
    try {
        const updatedTemplate = await createOrUpdateProblemTemplate(id, validTemplates);
        return NextResponse.json({ template: updatedTemplate });
    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }
}
