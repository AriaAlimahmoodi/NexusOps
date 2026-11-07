import type { SourceControlledFile } from '@n8n/api-types';
export declare function filterByType(files: SourceControlledFile[], resourceType: SourceControlledFile['type']): SourceControlledFile[];
export declare function getDeletedResources(files: SourceControlledFile[], resourceType: SourceControlledFile['type']): SourceControlledFile[];
export declare function getNonDeletedResources(files: SourceControlledFile[], resourceType: SourceControlledFile['type']): SourceControlledFile[];
