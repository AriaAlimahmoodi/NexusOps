import type { AgentEvalRunSummary } from '@n8n/api-types';
import { Logger, ModuleRegistry } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { AgentEvalResult, User } from '@n8n/db';
import { AgentEvalDatasetRepository, AgentEvalResultRepository, AgentEvalRunRepository } from '@n8n/db';
import { InstanceSettings } from 'n8n-core';
import { ConcurrencyControlService } from '../../concurrency/concurrency-control.service';
import { CredentialsService } from '../../credentials/credentials.service';
import { License } from '../../license';
import { AgentConfigService } from '../../modules/agents/agent-config.service';
import { AgentsSettingsService } from '../../modules/agents/agents-settings.service';
import { AgentRepository } from '../../modules/agents/repositories/agent.repository';
import { DataTableService } from '../../modules/data-table/data-table.service';
import { EvalAgentExecutionService } from '../../modules/instance-ai/eval/agent-execution.service';
import { AgentEvalsFlagGate } from './agent-evals-flag-gate';
export declare class AgentEvalRunnerService {
    private readonly logger;
    private readonly globalConfig;
    private readonly instanceSettings;
    private readonly moduleRegistry;
    private readonly datasetRepository;
    private readonly runRepository;
    private readonly resultRepository;
    private readonly agentRepository;
    private readonly dataTableService;
    private readonly evalAgentExecutionService;
    private readonly concurrencyControl;
    private readonly license;
    private readonly flagGate;
    private readonly agentsSettingsService;
    private readonly agentConfigService;
    private readonly credentialsService;
    constructor(logger: Logger, globalConfig: GlobalConfig, instanceSettings: InstanceSettings, moduleRegistry: ModuleRegistry, datasetRepository: AgentEvalDatasetRepository, runRepository: AgentEvalRunRepository, resultRepository: AgentEvalResultRepository, agentRepository: AgentRepository, dataTableService: DataTableService, evalAgentExecutionService: EvalAgentExecutionService, concurrencyControl: ConcurrencyControlService, license: License, flagGate: AgentEvalsFlagGate, agentsSettingsService: AgentsSettingsService, agentConfigService: AgentConfigService, credentialsService: CredentialsService);
    startRun(datasetId: string, projectId: string, user: User, options?: {
        timeoutMs?: number;
    }): Promise<{
        runId: string;
        finished: Promise<void>;
    }>;
    rerunResult(result: AgentEvalResult, agentId: string, projectId: string, user: User, options?: {
        timeoutMs?: number;
        whatToCheck?: string;
    }): Promise<AgentEvalResult>;
    getRunSummary(runId: string, agentId: string): Promise<AgentEvalRunSummary>;
    private executeRun;
    private startRunDeadline;
    private acquireEvaluationSlot;
    private failRun;
    cleanupInterruptedRuns(): Promise<void>;
    private runCase;
    private judgeCase;
    private suggestFix;
    private resolveCases;
}
