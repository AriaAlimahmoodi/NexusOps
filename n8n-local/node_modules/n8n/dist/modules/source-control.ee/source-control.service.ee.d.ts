import type { PullWorkFolderRequestDto, SourceControlledFile } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { type User } from '@n8n/db';
import type { PushResult } from 'simple-git';
import { IWorkflowToImport } from '../../interfaces';
import { SourceControlContextFactory } from './source-control-context.factory';
import { SourceControlExportService } from './source-control-export.service.ee';
import { SourceControlGitService } from './source-control-git.service.ee';
import { SourceControlImportService } from './source-control-import.service.ee';
import { SourceControlPreferencesService } from './source-control-preferences.service.ee';
import { SourceControlScopedService } from './source-control-scoped.service';
import { SourceControlStatusService } from './source-control-status.service.ee';
import type { ImportResult } from './types/import-result';
import type { SourceControlActionOrigin } from './types/source-control-action-origin';
import type { SourceControlGetStatus } from './types/source-control-get-status';
import type { SourceControlPreferences } from './types/source-control-preferences';
export type PushWorkfolderOptions = {
    commitMessage?: string;
    force?: boolean;
    fileNames: Array<Pick<SourceControlledFile, 'id' | 'type'>>;
};
export declare class SourceControlService {
    private readonly logger;
    private gitService;
    private sourceControlPreferencesService;
    private sourceControlExportService;
    private sourceControlImportService;
    private sourceControlContextFactory;
    private sourceControlScopedService;
    private readonly eventService;
    private readonly sourceControlStatusService;
    private sshKeyName;
    private sshFolder;
    private gitFolder;
    private isReloading;
    private readonly workfolderMutex;
    constructor(logger: Logger, gitService: SourceControlGitService, sourceControlPreferencesService: SourceControlPreferencesService, sourceControlExportService: SourceControlExportService, sourceControlImportService: SourceControlImportService, sourceControlContextFactory: SourceControlContextFactory, sourceControlScopedService: SourceControlScopedService, eventService: EventService, sourceControlStatusService: SourceControlStatusService);
    start(): Promise<void>;
    private isHostKeyVerificationError;
    private refreshServiceState;
    reloadConfiguration(): Promise<void>;
    private initGitService;
    sanityCheck(): Promise<void>;
    disconnect(options?: {
        keepKeyPair?: boolean;
    }): Promise<SourceControlPreferences>;
    initializeRepository(preferences: SourceControlPreferences, user: User): Promise<{
        branches: string[];
        currentBranch: string;
    }>;
    getBranches(): Promise<{
        branches: string[];
        currentBranch: string;
    }>;
    setBranch(branch: string): Promise<{
        branches: string[];
        currentBranch: string;
    }>;
    resetWorkfolder(): Promise<ImportResult | undefined>;
    private resetWorkfolderWithoutLock;
    pushWorkfolder(user: User, options: PushWorkfolderOptions, origin?: SourceControlActionOrigin): Promise<{
        statusCode: number;
        pushResult: PushResult | undefined;
        statusResult: SourceControlledFile[];
    }>;
    private resolveAuthorizedFilesToPush;
    private pushWorkfolderWithoutLock;
    pullWorkfolder(user: User, options: PullWorkFolderRequestDto): Promise<{
        statusCode: number;
        statusResult: SourceControlledFile[];
    }>;
    private pullWorkfolderWithoutLock;
    getStatus(user: User, options: SourceControlGetStatus): Promise<{
        file: string;
        id: string;
        name: string;
        type: "credential" | "datatable" | "file" | "folders" | "project" | "tags" | "variables" | "workflow";
        status: "conflicted" | "created" | "deleted" | "ignored" | "modified" | "new" | "renamed" | "staged" | "unknown";
        location: "local" | "remote";
        conflict: boolean;
        updatedAt: string;
        pushed?: boolean | undefined;
        isLocalPublished?: boolean | undefined;
        isRemoteArchived?: boolean | undefined;
        parentFolderId?: string | null | undefined;
        folderPath?: string[] | undefined;
        remoteFolderPath?: string[] | undefined;
        owner?: {
            type: "personal" | "team";
            projectId: string;
            projectName: string;
        } | undefined;
        publishingError?: string | undefined;
        publishingErrorDetails?: {
            reason: "changes_requested" | "insufficient_api_key_scope" | "insufficient_permissions" | "review_pending";
            workflowReviewRequestId?: string | undefined;
            versionId?: string | undefined;
        } | undefined;
        contentImportPolicy?: {
            violations: {
                kind: string;
                checkId: string;
                message: string;
                subject?: string | undefined;
                subjectType?: string | undefined;
                scope?: string | undefined;
                matchedRuleId?: string | undefined;
                projectId?: string | undefined;
                optInAvailable?: boolean | undefined;
            }[];
            checkErrors: {
                checkId: string;
                correlationId: string;
            }[];
        } | undefined;
    }[] | import("./types/source-control-get-status").SourceControlGetStatusVerboseResult>;
    getRemoteFileEntity({ user, type, id, commit, }: {
        user: User;
        type: SourceControlledFile['type'];
        id?: string;
        commit?: string;
    }): Promise<IWorkflowToImport>;
}
