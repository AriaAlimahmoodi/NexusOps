import type { PromotionProviderAuthType, PromotionSshKeyType } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { PromotionGitCredentials } from './promotions.types';
type PromotionGitPaths = {
    rootFolder: string;
    repositoryFolder: string;
    nextRepositoryFolder: string;
    sshDir: string;
};
type GitOperation = {
    remoteUrl: string;
    credentials: PromotionGitCredentials;
    paths: PromotionGitPaths;
    branchName: string;
    configId: string;
};
export declare class PromotionsGitService {
    private readonly logger;
    private readonly checkoutLocks;
    constructor(logger: Logger);
    private lockCheckout;
    validateRemoteUrl(remoteUrl: string, authType: PromotionProviderAuthType): void;
    private validateHttpRemoteUrl;
    private validateSshRemoteUrl;
    validateBranchName(branchName: string): Promise<void>;
    generateSshKeyPair(keyType: PromotionSshKeyType): Promise<{
        publicKey: string;
        privateKey: string;
    }>;
    clone({ remoteUrl, credentials, paths, branchName, configId }: GitOperation): Promise<void>;
    hasCheckout(repositoryFolder: string): Promise<boolean>;
    commitAndPush({ remoteUrl, credentials, paths, branchName, targetBranchName, configId, author, commitMessage, force, stagePathspec, onCheckoutRestored, rollbackOnFailure, }: GitOperation & {
        targetBranchName?: string;
        author: {
            name: string;
            email: string;
        };
        commitMessage: string;
        force: boolean;
        stagePathspec: string;
        onCheckoutRestored: () => Promise<void>;
        rollbackOnFailure?: boolean;
    }): Promise<{
        commitSha: string;
    }>;
    prepareCheckoutForPromotion(operation: GitOperation): Promise<void>;
    private commitAndPushToTargetBranch;
    private restorePromotionBase;
    private fetchBranch;
    refreshCheckout(operation: GitOperation): Promise<{
        commitSha: string;
    }>;
    listBranchTree({ pathspecs, ...operation }: GitOperation & {
        pathspecs: string[];
    }): Promise<{
        commitSha: string | null;
        lsTreeOutput: string;
    }>;
    hasCommittedPath({ paths, branchName, configId, pathspec, }: Pick<GitOperation, 'paths' | 'branchName' | 'configId'> & {
        pathspec: string;
    }): Promise<boolean>;
    readFilesAtCommit({ paths, branchName, configId, commitSha, filePaths, }: Pick<GitOperation, 'paths' | 'branchName' | 'configId'> & {
        commitSha: string;
        filePaths: readonly string[];
    }): Promise<Map<string, string>>;
    private withGit;
    private mapGitError;
}
export {};
