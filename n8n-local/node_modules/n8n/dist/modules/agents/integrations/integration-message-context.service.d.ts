import type { ToolContext } from '@n8n/agents';
import { Logger } from '@n8n/backend-common';
import type { IntegrationMessageContext, IntegrationMessageContextStore, SessionBinding } from './integration-tool-types';
import { AgentResourceRepository } from '../repositories/agent-resource.repository';
import { AgentThreadRepository } from '../repositories/agent-thread.repository';
export declare class IntegrationMessageContextService implements IntegrationMessageContextStore {
    private readonly threadRepository;
    private readonly resourceRepository;
    private readonly logger;
    constructor(threadRepository: AgentThreadRepository, resourceRepository: AgentResourceRepository, logger: Logger);
    getLatest(threadId: string): Promise<IntegrationMessageContext | null>;
    getForResume(persistence: NonNullable<ToolContext['persistence']>): Promise<IntegrationMessageContext | null>;
    getLatestForIncoming(threadId: string): Promise<IntegrationMessageContext | null>;
    installIncoming(context: IntegrationMessageContext, memory: SessionBinding, conversation: SessionBinding): Promise<void>;
    setLatest(threadId: string, resourceId: string, context: IntegrationMessageContext): Promise<void>;
    bindSession(derivedThreadId: string, origin: SessionBinding): Promise<void>;
    resolveSession(derivedThreadId: string): Promise<SessionBinding | null>;
    unbindSession(derivedThreadId: string): Promise<void>;
    clearSessionBindings(originThreadId: string): Promise<void>;
    private writeContinueAsIfAbsent;
    private appendBoundThread;
    private writeMetadata;
    private parseMetadata;
}
