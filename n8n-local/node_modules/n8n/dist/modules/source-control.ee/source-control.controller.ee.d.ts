import { PullWorkFolderRequestDto, PushWorkFolderRequestDto, type GitCommitInfo, type SourceControlledFile } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import { AuthenticatedRequest } from '@n8n/db';
import * as express from 'express';
import type { PullResult } from 'simple-git';
import { SourceControlContextFactory } from './source-control-context.factory';
import { SourceControlPreferencesService } from './source-control-preferences.service.ee';
import { SourceControlScopedService } from './source-control-scoped.service';
import { SourceControlService } from './source-control.service.ee';
import type { ImportResult } from './types/import-result';
import { SourceControlRequest } from './types/requests';
import type { SourceControlPreferences } from './types/source-control-preferences';
import { IWorkflowToImport } from '../../interfaces';
export declare class SourceControlController {
    private readonly sourceControlService;
    private readonly sourceControlPreferencesService;
    private readonly sourceControlScopedService;
    private readonly sourceControlContextFactory;
    private readonly eventService;
    constructor(sourceControlService: SourceControlService, sourceControlPreferencesService: SourceControlPreferencesService, sourceControlScopedService: SourceControlScopedService, sourceControlContextFactory: SourceControlContextFactory, eventService: EventService);
    getPreferences(req: AuthenticatedRequest): Promise<Partial<SourceControlPreferences>>;
    setPreferences(req: SourceControlRequest.UpdatePreferences): Promise<SourceControlPreferences>;
    updatePreferences(req: SourceControlRequest.UpdatePreferences): Promise<SourceControlPreferences>;
    disconnect(req: SourceControlRequest.Disconnect): Promise<SourceControlPreferences>;
    getBranches(): Promise<{
        branches: string[];
        currentBranch: string;
    }>;
    pushWorkfolder(req: AuthenticatedRequest, res: express.Response, payload: PushWorkFolderRequestDto): Promise<{
        files: SourceControlledFile[];
        commit: GitCommitInfo | null;
    }>;
    pullWorkfolder(req: AuthenticatedRequest, res: express.Response, payload: PullWorkFolderRequestDto): Promise<SourceControlledFile[] | ImportResult | PullResult | undefined>;
    resetWorkfolder(): Promise<ImportResult | undefined>;
    getStatus(req: SourceControlRequest.GetStatus): Promise<{
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
    status(req: SourceControlRequest.GetStatus): Promise<{
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
    generateKeyPair(req: SourceControlRequest.GenerateKeyPair): Promise<SourceControlPreferences>;
    getFileContent(req: AuthenticatedRequest & {
        params: {
            type: SourceControlledFile['type'];
            id: string;
        };
    }): Promise<{
        content: IWorkflowToImport;
        type: SourceControlledFile['type'];
    }>;
}
