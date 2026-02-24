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
    static async canExecute(context: RBACContext): Promise<boolean> {
        const { userId, hackathonId, action, resourceId } = context;
        const role = await getUserRole(hackathonId, userId);
        if (!role) {
            console.warn(`RBAC: No role found for user ${userId} in hackathon ${hackathonId}`);
            return false;
        }
        if (!PERMISSIONS[role].has(action)) {
            console.warn(`RBAC: Role ${role} denied action ${action}`);
            return false;
        }
        if (action === 'SCORE_PROJECT' && role === 'JUDGE') {
            const { getHackathonById } = await import("@/repository/hackathon.repository");
            const hackathon = await getHackathonById(hackathonId);
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
    static async getBlindSubmission(userId: string, hackathonId: string, submissionId: string) {
        const canScore = await this.canExecute({
            userId,
            hackathonId,
            action: 'SCORE_PROJECT'
        });
        const role = await getUserRole(hackathonId, userId);
        if (role === 'JUDGE') {
            return await getSubmissionForBlindJudging(submissionId);
        }
        if (role === 'ORGANIZER') {
            return { id: submissionId, warning: "Full access not fully implemented in this helper" };
        }
        throw new Error("Access denied or not implemented for this role preference");
    }
    static async validateJoinRequest(userId: string, hackathonId: string, globalRole: string): Promise<boolean> {
        const { getHackathonById } = await import("@/repository/hackathon.repository");
        const hackathon = await getHackathonById(hackathonId);
        if (!hackathon) throw new Error("Hackathon not found");
        if (hackathon.status !== 'PUBLISHED') {
            throw new Error(`Hackathon is ${hackathon.status}, expected PUBLISHED`);
        }
        const existingRole = await getUserRole(hackathonId, userId);
        if (existingRole) {
            throw new Error(`You already have the role of ${existingRole} in this hackathon`);
        }
        const allowedGlobalRoles = ['student', 'faculty', 'admin'];
        if (!allowedGlobalRoles.includes(globalRole.toLowerCase())) {
            throw new Error(`Global Role ${globalRole} not allowed to join`);
        }
        return true;
    }
    static async validateRemovalRequest(requesterId: string, hackathonId: string, targetUserId: string, requesterGlobalRole: string): Promise<boolean> {
        if (requesterGlobalRole === 'admin') {
        } else {
            const requesterRole = await getUserRole(hackathonId, requesterId);
            if (requesterRole !== 'ORGANIZER') {
                console.warn(`RBAC Validation Failed: Requester ${requesterId} is not ORGANIZER`);
                return false;
            }
        }
        const targetRole = await getUserRole(hackathonId, targetUserId);
        if (targetRole !== 'PARTICIPANT') {
            console.warn(`RBAC Validation Failed: Target ${targetUserId} is ${targetRole}, not PARTICIPANT`);
            return false;
        }
        return true;
    }
}
