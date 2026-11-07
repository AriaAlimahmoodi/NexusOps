import { type AgentBudgetSpend, type AgentConfigValidationResponse, UpdateAgentConfigDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentConfigService } from './agent-config.service';
import { AgentCustomToolsService } from './agent-custom-tools.service';
import { AgentValidationService } from './agent-validation.service';
import { AgentSpendLedger } from './budget-guardrail';
import { AgentRepository } from './repositories/agent.repository';
import { CollaborationService } from '../../collaboration/collaboration.service';
import { CredentialsService } from '../../credentials/credentials.service';
export declare class AgentsConfigController {
    private readonly agentConfigService;
    private readonly agentCustomToolsService;
    private readonly agentValidationService;
    private readonly credentialsService;
    private readonly agentRepository;
    private readonly collaborationService;
    private readonly agentSpendLedger;
    constructor(agentConfigService: AgentConfigService, agentCustomToolsService: AgentCustomToolsService, agentValidationService: AgentValidationService, credentialsService: CredentialsService, agentRepository: AgentRepository, collaborationService: CollaborationService, agentSpendLedger: AgentSpendLedger);
    getBudget(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>): Promise<AgentBudgetSpend>;
    getConfig(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>): Promise<{
        config: {
            name: string;
            description?: string | undefined;
            model: string;
            credential?: string | undefined;
            modelDeploymentName?: string | undefined;
            instructions: string;
            personalisation?: {
                icon: string;
                gradient: {
                    from: string;
                    to: string;
                    angle: number;
                    fromStop: number;
                    toStop: number;
                };
            } | undefined;
            memory?: {
                enabled: boolean;
                storage: "n8n";
                observationalMemory?: {
                    enabled?: boolean | undefined;
                    observerModel?: {
                        model: string;
                        credential: string;
                    } | undefined;
                    reflectorModel?: {
                        model: string;
                        credential: string;
                    } | undefined;
                    observerThresholdTokens?: number | undefined;
                    reflectorThresholdTokens?: number | undefined;
                    renderTokenBudget?: number | undefined;
                    observationLogTailLimit?: number | undefined;
                    lockTtlMs?: number | undefined;
                } | undefined;
                episodicMemory?: {
                    enabled: false;
                } | {
                    enabled: true;
                    credential: string;
                    reflectorModel?: {
                        model: string;
                        credential: string;
                    } | undefined;
                    topK?: number | undefined;
                    maxEntriesPerRun?: number | undefined;
                } | undefined;
            } | undefined;
            subAgents?: {
                maxChildren?: number | undefined;
                agents?: {
                    agentId: string;
                    useWhen?: string | undefined;
                    enabled?: boolean | undefined;
                }[] | undefined;
                modelsByDifficulty?: {
                    low?: {
                        model: string;
                        credential: string;
                    } | undefined;
                    medium?: {
                        model: string;
                        credential: string;
                    } | undefined;
                    high?: {
                        model: string;
                        credential: string;
                    } | undefined;
                } | undefined;
            } | undefined;
            tools?: ({
                type: "custom";
                enabled?: boolean | undefined;
                id: string;
                requireApproval?: boolean | undefined;
            } | {
                type: "workflow";
                enabled?: boolean | undefined;
                workflowId?: string | undefined;
                workflow: string;
                name?: string | undefined;
                description?: string | undefined;
                requireApproval?: boolean | undefined;
                allOutputs?: boolean | undefined;
                inputs?: Record<string, {
                    mode: "ai";
                    description?: string | undefined;
                } | {
                    mode: "fixed";
                    value: import("n8n-workflow").JsonValue;
                } | {
                    mode: "expression";
                    value: string;
                }> | undefined;
            } | {
                type: "node";
                enabled?: boolean | undefined;
                name: string;
                description?: string | undefined;
                inputSchema?: undefined;
                node: {
                    nodeType: string;
                    nodeTypeVersion: number;
                    nodeParameters: Record<string, unknown>;
                    credentials?: Record<string, {
                        id: string;
                        name: string;
                    } | {
                        id: null;
                        name: string;
                        __aiGatewayManaged: true;
                    }> | undefined;
                };
                requireApproval?: boolean | undefined;
            })[] | undefined;
            skills?: {
                type: "skill";
                versionId?: string | undefined;
                id: string;
            }[] | undefined;
            tasks?: {
                type: "task";
                id: string;
                enabled: boolean;
            }[] | undefined;
            providerTools?: Record<string, Record<string, unknown>> | undefined;
            integrations?: ({
                type: "telegram";
                credentialId: string;
                approval?: {
                    mode: "global";
                } | {
                    mode: "selected";
                    tools: string[];
                } | undefined;
                settings?: {
                    accessMode: "private" | "public";
                    allowedUsers: string[];
                    sessionIdleTimeoutMinutes?: number | null | undefined;
                } | undefined;
            } | {
                type: "slack";
                credentialId: string;
                approval?: {
                    mode: "global";
                } | {
                    mode: "selected";
                    tools: string[];
                } | undefined;
                settings?: {
                    messagingExperience: "agent" | "assistant";
                    sessionIdleTimeoutMinutes?: number | null | undefined;
                } | undefined;
            } | {
                type: "linear";
                credentialId: string;
                approval?: {
                    mode: "global";
                } | {
                    mode: "selected";
                    tools: string[];
                } | undefined;
                settings?: {
                    sessionIdleTimeoutMinutes?: number | null | undefined;
                } | undefined;
            } | {
                type: "discord";
                credentialId: string;
                approval?: {
                    mode: "global";
                } | {
                    mode: "selected";
                    tools: string[];
                } | undefined;
                settings?: {
                    sessionIdleTimeoutMinutes?: number | null | undefined;
                } | undefined;
            } | {
                type: "whatsapp";
                credentialId: string;
                approval?: {
                    mode: "global";
                } | {
                    mode: "selected";
                    tools: string[];
                } | undefined;
                settings?: {
                    sessionIdleTimeoutMinutes?: number | null | undefined;
                    typingIndicator?: boolean | undefined;
                    downloadMedia?: boolean | undefined;
                    mediaRetentionDays?: number | undefined;
                } | undefined;
            } | {
                type: "teams";
                credentialId: string;
                approval?: {
                    mode: "global";
                } | {
                    mode: "selected";
                    tools: string[];
                } | undefined;
                settings?: {
                    sessionIdleTimeoutMinutes?: number | null | undefined;
                    displayName?: string | undefined;
                    description?: string | undefined;
                    teamChannels?: boolean | undefined;
                    groupChats?: boolean | undefined;
                    readAllChannelMessages?: boolean | undefined;
                    readAllGroupMessages?: boolean | undefined;
                } | undefined;
            } | {
                type: "n8n_chat";
                credentialId: "";
            })[] | undefined;
            mcpServers?: {
                name: string;
                description?: string | undefined;
                url: string;
                transport: "sse" | "streamableHttp";
                authentication: string;
                credential?: string | undefined;
                metadata?: {
                    nodeTypeName?: string | undefined;
                } | undefined;
                toolPermissions?: {
                    categories: {
                        read: "always_allow" | "blocked" | "require_approval";
                        write: "always_allow" | "blocked" | "require_approval";
                    };
                    tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
                } | undefined;
                connectionTimeoutMs?: number | undefined;
            }[] | undefined;
            vectorStores?: ({
                name: string;
                credential: string;
                useWhen: string;
                embedding: {
                    model: string;
                    credential: string;
                };
                provider: "pinecone";
                indexName: string;
                namespace?: string | undefined;
            } | {
                name: string;
                credential: string;
                useWhen: string;
                embedding: {
                    model: string;
                    credential: string;
                };
                provider: "qdrant";
                collectionName: string;
            } | {
                name: string;
                credential: string;
                useWhen: string;
                embedding: {
                    model: string;
                    credential: string;
                };
                provider: "supabase";
                tableName: string;
                queryName?: string | undefined;
            } | {
                name: string;
                credential: string;
                useWhen: string;
                embedding: {
                    model: string;
                    credential: string;
                };
                provider: "postgres";
                tableName: string;
            })[] | undefined;
            config?: {
                reasoning?: "high" | "low" | "medium" | undefined;
                promptCaching?: {
                    enabled: boolean;
                    anthropic?: {
                        ttl?: "1h" | "5m" | undefined;
                    } | undefined;
                } | undefined;
                webSearch?: {
                    enabled: boolean;
                    provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                    credential?: string | undefined;
                } | undefined;
                toolCallConcurrency?: number | undefined;
                maxIterations?: number | undefined;
                guardrails?: {
                    budget?: {
                        enabled: boolean;
                        monthlyBudgetUsd?: number | undefined;
                        alertThresholdPercent?: number | undefined;
                        sessionCostCapUsd?: number | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
        };
        configHash: string;
    }>;
    getValidation(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>): Promise<AgentConfigValidationResponse>;
    putConfig(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
    }>, _res: Response, agentId: string, payload: UpdateAgentConfigDto): Promise<import("@n8n/api-types").AgentConfigMutationResponse>;
    deleteTool(req: AuthenticatedRequest<{
        projectId: string;
        agentId: string;
        toolId: string;
    }>, _res: Response, agentId: string, toolId: string): Promise<{
        ok: boolean;
    }>;
}
