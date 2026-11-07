import { type AgentIntegrationConfig, type AgentIntegrationStatusResponse } from '@n8n/api-types';
import type { AgentChannelStatus } from '../entities/agent-channel-status.entity';
export type IsLiveRow = (row: AgentChannelStatus) => boolean;
export declare function buildChannelStatusReport(integrations: AgentIntegrationConfig[] | null | undefined, activeVersionId: string | null, statuses: AgentChannelStatus[], isLive: IsLiveRow, publishedIntegrations?: AgentIntegrationConfig[]): Omit<AgentIntegrationStatusResponse, 'n8nChat'>;
