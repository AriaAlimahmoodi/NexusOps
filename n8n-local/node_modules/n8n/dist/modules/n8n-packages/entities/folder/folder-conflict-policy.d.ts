import { FolderConflictPolicy } from '../../n8n-packages.types';
import type { ImportFolderProperties, ImportProjectProperties } from '../../n8n-packages.types';
export interface MatchedFolderDecision {
    blocked: boolean;
}
export declare function decideMatchedFolder(policy: FolderConflictPolicy): MatchedFolderDecision;
export declare function removesUnpackagedWorkflows(policy: FolderConflictPolicy): boolean;
export declare function resolveFolderConflictPolicy(request: ImportProjectProperties & ImportFolderProperties, packageShape: 'project' | 'workflow'): FolderConflictPolicy;
export declare function folderPolicyRejection(request: ImportProjectProperties & ImportFolderProperties, packageShape: 'project' | 'workflow'): string | undefined;
