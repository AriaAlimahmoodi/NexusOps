import type { PushMessage } from '@n8n/api-types';
import { ExecutionsConfig } from '@n8n/config';
import type { BooleanLicenseFeature, NumericLicenseFeature } from '@n8n/constants';
import { PollerStateRepository, ScheduledJobRepository, SettingsRepository, UserRepository } from '@n8n/db';
import { Request } from 'express';
import type nodeFs from 'node:fs';
import type { Profiler } from 'node:inspector';
import { ActiveWorkflowManager } from '../active-workflow-manager';
import { License } from '../license';
import { MfaService } from '../mfa/mfa.service';
import { LogStreamingDestinationService } from '../modules/log-streaming.ee/log-streaming-destination.service';
import { Push } from '../push';
import { WorkflowScheduledJobOwner } from '../scheduling/workflow-scheduled-job-owner';
import { CacheService } from '@n8n/backend-services';
import { FrontendService } from '../services/frontend.service';
import { HeapDiagnosticsService } from '../services/heap-diagnostics.service';
import { PasswordUtility } from '../services/password.utility';
import { ProcessInternalsService } from '../services/process-internals.service';
import { WorkflowStaticDataService } from '../workflows/workflow-static-data.service';
type UserSetupPayload = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    mfaEnabled?: boolean;
    mfaSecret?: string;
    mfaRecoveryCodes?: string[];
};
type ResetRequest = Request<{}, {}, {
    owner: UserSetupPayload;
    members: UserSetupPayload[];
    admin: UserSetupPayload;
    chat: UserSetupPayload;
}>;
type PushRequest = Request<{}, {}, {
    pushRef: string;
} & PushMessage>;
export declare class E2EController {
    private readonly settingsRepo;
    private readonly workflowRunner;
    private readonly mfaService;
    private readonly cacheService;
    private readonly push;
    private readonly passwordUtility;
    private readonly userRepository;
    private readonly frontendService;
    private readonly executionsConfig;
    private readonly logStreamingDestinationsService;
    private readonly scheduledJobRepository;
    private readonly workflowScheduledJobOwner;
    private readonly pollerStateRepository;
    private readonly workflowStaticDataService;
    private readonly processInternalsService;
    private readonly heapDiagnosticsService;
    private enabledFeatures;
    private static readonly numericFeaturesDefaults;
    private numericFeatures;
    constructor(license: License, settingsRepo: SettingsRepository, workflowRunner: ActiveWorkflowManager, mfaService: MfaService, cacheService: CacheService, push: Push, passwordUtility: PasswordUtility, userRepository: UserRepository, frontendService: FrontendService, executionsConfig: ExecutionsConfig, logStreamingDestinationsService: LogStreamingDestinationService, scheduledJobRepository: ScheduledJobRepository, workflowScheduledJobOwner: WorkflowScheduledJobOwner, pollerStateRepository: PollerStateRepository, workflowStaticDataService: WorkflowStaticDataService, processInternalsService: ProcessInternalsService, heapDiagnosticsService: HeapDiagnosticsService);
    reset(req: ResetRequest): Promise<void>;
    pushSend(req: PushRequest): Promise<void>;
    setFeature(req: Request<{}, {}, {
        feature: BooleanLicenseFeature;
        enabled: boolean;
    }>): void;
    setQuota(req: Request<{}, {}, {
        feature: NumericLicenseFeature;
        value: number;
    }>): void;
    setQueueMode(req: Request<{}, {}, {
        enabled: boolean;
    }>): Promise<{
        success: boolean;
        message: string;
    }>;
    countScheduledJobs(req: Request<{}, {}, {}, {
        workflowId: string;
        nodeId: string;
    }>): Promise<{
        count: number;
    }>;
    getPollerState(req: Request<{}, {}, {}, {
        workflowId: string;
        nodeId: string;
    }>): Promise<{
        cursor: import("@n8n/db").PollerCursor | null;
        consecutiveErrors: number;
        backoffUntil: Date | null;
    }>;
    clearWorkflowStaticData(req: Request<{}, {}, {
        workflowId: string;
    }>): Promise<{
        success: boolean;
    }>;
    fireScheduledJobsNow(req: Request<{}, {}, {
        workflowId: string;
        nodeId: string;
    }>): Promise<{
        success: boolean;
    }>;
    backdateScheduledJob(req: Request<{}, {}, {
        workflowId: string;
        nodeId: string;
        secondsAgo: number;
    }>): Promise<{
        success: boolean;
    }>;
    getEnvFeatureFlags(): Promise<import("@n8n/api-types").N8nEnvFeatFlags>;
    setEnvFeatureFlags(req: Request<{}, {}, {
        flags: Record<string, string>;
    }>): Promise<{
        success: boolean;
        message: string;
        flags?: undefined;
    } | {
        success: boolean;
        message: string;
        flags: import("@n8n/api-types").N8nEnvFeatFlags;
    }>;
    triggerGarbageCollection(): import("../services/heap-diagnostics.service").GarbageCollectionResult;
    takeHeapSnapshot(): import("../services/heap-diagnostics.service").HeapSnapshotResult;
    downloadHeapSnapshot(req: Request): nodeFs.ReadStream;
    private coverageSession?;
    private coverageBaseline;
    private ensureCoverageSession;
    private static coverageKey;
    private static coverageCount;
    private static indexCoverage;
    private static deltaCoverage;
    startCoverage(): Promise<{
        success: boolean;
    }>;
    takeCoverage(): Promise<{
        success: boolean;
        result: Profiler.ScriptCoverage[];
    }>;
    getInternals(): import("@n8n/api-types").ProcessInternals;
    getMemoryMaps(): {
        processMemoryUsage: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
            arrayBuffers: number;
        };
        rollup: Record<string, number> | null;
        mappings: Array<{
            name: string;
            rssMB: number;
            pssMB: number;
            count: number;
        }> | null;
        raw: string | null;
    };
    private resetFeatures;
    private removeActiveWorkflows;
    private resetLogStreaming;
    private truncateAll;
    private reseedRolesAndScopes;
    private setupUserManagement;
    private resetCache;
}
export {};
