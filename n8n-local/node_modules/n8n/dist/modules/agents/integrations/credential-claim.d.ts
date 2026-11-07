import type { AgentChannelPreconditionContext } from './agent-chat-integration';
import type { AgentRepository } from '../repositories/agent.repository';
export declare function assertCredentialNotClaimed(agentRepository: AgentRepository, displayLabel: string, type: string, ctx: AgentChannelPreconditionContext): Promise<void>;
