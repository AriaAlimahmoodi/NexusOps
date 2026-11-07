import { type AgentIntegrationConfig } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import type { ProjectAgent } from '../entities/agent.entity';
export declare function syncAgentIntegrations(agent: ProjectAgent, previous: AgentIntegrationConfig[], next: AgentIntegrationConfig[], logger: Logger): Promise<void>;
