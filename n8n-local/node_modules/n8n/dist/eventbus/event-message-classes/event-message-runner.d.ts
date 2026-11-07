import { EventMessageTypeNames } from 'n8n-workflow';
import { AbstractEventMessage } from './abstract-event-message';
import type { AbstractEventMessageOptions } from './abstract-event-message-options';
import type { AbstractEventPayload } from './abstract-event-payload';
export interface EventPayloadRunner extends AbstractEventPayload {
    taskId: string;
    nodeId: string;
    executionId: string;
    workflowId: string;
}
export interface EventMessageRunnerOptions extends AbstractEventMessageOptions {
    payload?: EventPayloadRunner;
}
export declare class EventMessageRunner extends AbstractEventMessage {
    readonly __type = EventMessageTypeNames.runner;
    payload: EventPayloadRunner;
    constructor(options: EventMessageRunnerOptions);
    setPayload(payload: EventPayloadRunner): this;
}
