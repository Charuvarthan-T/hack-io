export type HackathonEventType = 'participant.joined' | 'participant.removed';
interface AgentEvent {
    type: HackathonEventType;
    payload: any;
    timestamp: Date;
}
export class EventService {
    static async emit(type: HackathonEventType, payload: any) {
        const event: AgentEvent = {
            type,
            payload,
            timestamp: new Date()
        };
        console.log(`[EventService] Emitting: ${type}`, JSON.stringify(payload, null, 2));
    }
}
