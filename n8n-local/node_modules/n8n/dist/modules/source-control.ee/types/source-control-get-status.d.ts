import type { SourceControlledFile } from '@n8n/api-types';
import type { StatusExportableCredential } from './exportable-credential';
import type { ExportableDataTable, StatusExportableDataTable } from './exportable-data-table';
import type { ExportableFolder } from './exportable-folders';
import type { ExportableProjectWithFileName } from './exportable-project';
import type { ExportableTagEntity, ExportableWorkflowTagMapping } from './exportable-tags';
import type { ExportableVariable } from './exportable-variable';
import type { SourceControlActionOrigin } from './source-control-action-origin';
import type { SourceControlWorkflowVersionId } from './source-control-workflow-version-id';
export interface SourceControlGetStatusVerboseResult {
    wfRemoteVersionIds: SourceControlWorkflowVersionId[];
    wfLocalVersionIds: SourceControlWorkflowVersionId[];
    wfMissingInLocal: SourceControlWorkflowVersionId[];
    wfMissingInRemote: SourceControlWorkflowVersionId[];
    wfModifiedInEither: SourceControlWorkflowVersionId[];
    credMissingInLocal: StatusExportableCredential[];
    credMissingInRemote: StatusExportableCredential[];
    credModifiedInEither: StatusExportableCredential[];
    varMissingInLocal: ExportableVariable[];
    varMissingInRemote: ExportableVariable[];
    varModifiedInEither: ExportableVariable[];
    dtMissingInLocal: ExportableDataTable[];
    dtMissingInRemote: StatusExportableDataTable[];
    dtModifiedInEither: Array<ExportableDataTable | StatusExportableDataTable>;
    tagsMissingInLocal: ExportableTagEntity[];
    tagsMissingInRemote: ExportableTagEntity[];
    tagsModifiedInEither: ExportableTagEntity[];
    mappingsMissingInLocal: ExportableWorkflowTagMapping[];
    mappingsMissingInRemote: ExportableWorkflowTagMapping[];
    foldersMissingInLocal: ExportableFolder[];
    foldersMissingInRemote: ExportableFolder[];
    foldersModifiedInEither: ExportableFolder[];
    projectsRemote: ExportableProjectWithFileName[];
    projectsLocal: ExportableProjectWithFileName[];
    projectsMissingInLocal: ExportableProjectWithFileName[];
    projectsMissingInRemote: ExportableProjectWithFileName[];
    projectsModifiedInEither: ExportableProjectWithFileName[];
    sourceControlledFiles: SourceControlledFile[];
}
export declare class SourceControlGetStatus {
    direction: 'push' | 'pull';
    preferLocalVersion: boolean;
    verbose: boolean;
    origin?: SourceControlActionOrigin;
    constructor(values: {
        direction: 'push' | 'pull';
        preferLocalVersion: string | boolean;
        verbose: string | boolean;
    });
}
