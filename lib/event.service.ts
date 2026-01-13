
// Simple Event Service to decouple Action from Reaction (Agent Notification)

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

        // In a real agentic system, this would push to a Queue (Redis/RabbitMQ) 
        // or call an Agent Orchestrator webhook.
        // For now, we just log it as the "emission".

        // Future extension: 
        // await AgentOrchestrator.notify(event);
    }
}
