
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
            // Check Hackathon Phase
            const { getHackathonById } = await import("@/repository/hackathon.repository");
            const hackathon = await getHackathonById(hackathonId);
            if (hackathon?.phase !== 'EVALUATION') {
                console.warn(`RBAC: Judge denied scoring during ${hackathon?.phase} phase`);
                return false;
            }

            // Check if already evaluated (Finalized)
            const { getEvaluation } = await import("@/repository/evaluation.repository");
            if (resourceId) {
                const evaluation = await getEvaluation(resourceId, userId);
                if (evaluation && !evaluation.is_draft) {
                    console.warn(`RBAC: Judge denied scoring finalized evaluation ${resourceId}`);
                    return false;
                }
            }

            return true;
        }

        if (action === 'VIEW_PROJECT') {
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


    // ==================== Participant Membership Rules ====================

    /**
     * Validates if a user can self-join a hackathon.
     * Rules:
     * 1. Hackathon matches PUBLISHED state (or ACTIVE if late join allowed, but spec says PUBLISHED)
     * 2. User has no existing role
     * 3. Global role is Student or Faculty (Strictly NO Judges/Mentors self-joining if they already have that role)
     */
    static async validateJoinRequest(userId: string, hackathonId: string, globalRole: string): Promise<boolean> {
        // 0. Fetch Hackathon State (Need to import getHackathonById)
        const { getHackathonById } = await import("@/repository/hackathon.repository");
        const hackathon = await getHackathonById(hackathonId);

        if (!hackathon) throw new Error("Hackathon not found");

        // Rule 1: State Check
        if (hackathon.status !== 'PUBLISHED') {
            throw new Error(`Hackathon is ${hackathon.status}, expected PUBLISHED`);
        }

        // Rule 2: Existing Role Check
        const existingRole = await getUserRole(hackathonId, userId);
        if (existingRole) {
            throw new Error(`You already have the role of ${existingRole} in this hackathon`);
        }

        // Rule 3: Global Role Check
        // assuming globalRole is passed from session.user.role
        const allowedGlobalRoles = ['student', 'faculty', 'admin']; // Admin can technically join to test
        if (!allowedGlobalRoles.includes(globalRole.toLowerCase())) {
            throw new Error(`Global Role ${globalRole} not allowed to join`);
        }

        return true;
    }

    /**
     * Validates if a requester can remove a target user.
     * Rules:
     * 1. Requester must be ORGANIZER (of this event) or Global ADMIN.
     * 2. Target must be PARTICIPANT (cannot remove other officials via this flow).
     */
    static async validateRemovalRequest(requesterId: string, hackathonId: string, targetUserId: string, requesterGlobalRole: string): Promise<boolean> {
        // 1. Check Requester Role
        // Global Admin always allowed
        if (requesterGlobalRole === 'admin') {
            // pass
        } else {
            // Start Local Check
            const requesterRole = await getUserRole(hackathonId, requesterId);
            if (requesterRole !== 'ORGANIZER') {
                console.warn(`RBAC Validation Failed: Requester ${requesterId} is not ORGANIZER`);
                return false;
            }
        }

        // 2. Check Target Role
        const targetRole = await getUserRole(hackathonId, targetUserId);
        if (targetRole !== 'PARTICIPANT') {
            console.warn(`RBAC Validation Failed: Target ${targetUserId} is ${targetRole}, not PARTICIPANT`);
            return false;
        }

        return true;
    }
}
