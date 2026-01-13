
import { getUserRole, HackathonRole } from "@/repository/hackathon.repository";
import { getSubmissionForBlindJudging } from "@/repository/hackathon.repository";


export type RBACAction =
    | 'VIEW_HACKATHON'
    | 'MANAGE_SETTINGS'
    | 'MANAGE_USERS'
    | 'SUBMIT_PROJECT'
    | 'VIEW_PROJECT'
    | 'SCORE_PROJECT'
    | 'MENTOR_VIEW'
    | 'TRIGGER_AGENT';

export interface RBACContext {
    userId: string;
    hackathonId: string;
    action: RBACAction;
    resourceId?: string; 
}


const PERMISSIONS: Record<HackathonRole, Set<RBACAction>> = {
    ORGANIZER: new Set([
        'VIEW_HACKATHON',
        'MANAGE_SETTINGS',
        'MANAGE_USERS',
        'VIEW_PROJECT',
        'TRIGGER_AGENT'
    ]),
    PARTICIPANT: new Set([
        'VIEW_HACKATHON',
        'SUBMIT_PROJECT',
        'VIEW_PROJECT' 
    ]),
    JUDGE: new Set([
        'VIEW_HACKATHON',
        'VIEW_PROJECT',
        'SCORE_PROJECT',
        'TRIGGER_AGENT' 
    ]),
    MENTOR: new Set([
        'VIEW_HACKATHON',
        'VIEW_PROJECT',
        'MENTOR_VIEW'
    ])
};


export class RBACService {
    /**
     * Deterministically checks if a user can perform an action in a given context.
     * This is the PRIMARY gate for Agents.
     */
    static async canExecute(context: RBACContext): Promise<boolean> {
        const { userId, hackathonId, action, resourceId } = context;

        // 1. Get User Contextual Role
        const role = await getUserRole(hackathonId, userId);
        if (!role) {
            console.warn(`RBAC: No role found for user ${userId} in hackathon ${hackathonId}`);
            return false;
        }

        // 2. Check Base Role Permissions
        if (!PERMISSIONS[role].has(action)) {
            console.warn(`RBAC: Role ${role} denied action ${action}`);
            return false;
        }

        // 3. Conditional / Resource-Specific Checks
        if (action === 'SCORE_PROJECT' && role === 'JUDGE') {
            // Additional check: Is this judge assigned to this project?
            // For MVP, we allow judges to score any project unless we add specific assignment logic.
            // But we MUST enforce Blind Judging at the data access level, not just here.
            return true;
        }

        if (action === 'VIEW_PROJECT') {
            // All roles can view projects, but DATA returned differs.
            // The Service simply says "Yes you can view", the Controller must sanitize.
            return true;
        }

        return true;
    }

    /**
     * Helper to ensure Agents get sanitized data for Judges.
     * Throws if permission denied.
     */
    static async getBlindSubmission(userId: string, hackathonId: string, submissionId: string) {
        const canScore = await this.canExecute({
            userId,
            hackathonId,
            action: 'SCORE_PROJECT'
        });

        // If they can't score, maybe they are just viewing? 
        // If they are a JUDGE viewing, they must see BLIND data.
        const role = await getUserRole(hackathonId, userId);

        if (role === 'JUDGE') {
            // Force Blind Data
            return await getSubmissionForBlindJudging(submissionId);
        }

        // Non-Judges (Organizers) might see full data, but Participants should only see public data.
        // For now, return safe default or error if not implemented for other roles.
        if (role === 'ORGANIZER') {
            // Return full data (would call a different repo method)
            // placeholder:
            return { id: submissionId, warning: "Full access not fully implemented in this helper" };
        }

        throw new Error("Access denied or not implemented for this role preference");
    }
}
