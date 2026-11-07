import { EventMessageTypeNames } from 'n8n-workflow';
import type { McpResolvedAuthType } from '@n8n/backend-services/auth';
import type { EventNamesMcpType } from '.';
import { AbstractEventMessage } from './abstract-event-message';
import type { AbstractEventMessageOptions } from './abstract-event-message-options';
import type { AbstractEventPayload } from './abstract-event-payload';
export interface EventPayloadMcp extends AbstractEventPayload {
    msg?: string;
    userId?: string;
    _email?: string;
    _firstName?: string;
    _lastName?: string;
    globalRole?: string;
    toolName?: string;
    workflowId?: string;
    status?: 'success' | 'error';
    errorMessage?: string;
    authType?: McpResolvedAuthType;
    clientId?: string;
    clientName?: string;
    enabled?: boolean;
}
export interface EventMessageMcpOptions extends AbstractEventMessageOptions {
    eventName: EventNamesMcpType;
    payload?: EventPayloadMcp;
}
export declare class EventMessageMcp extends AbstractEventMessage {
    readonly __type = EventMessageTypeNames.mcp;
    eventName: EventNamesMcpType;
    payload: EventPayloadMcp;
    constructor(options: EventMessageMcpOptions);
    setPayload(payload: EventPayloadMcp): this;
}
