import { Logger } from '@n8n/backend-common';
import type { Project, User } from '@n8n/db';
import { CredentialsRepository, SharedCredentialsRepository, UserRepository } from '@n8n/db';
import type { INode } from 'n8n-workflow';
import { CredentialsFinderService, type UnusableCredential } from '@n8n/backend-services';
import { NodeTypes } from '../../node-types';
import { OwnershipService } from '../../services/ownership.service';
import { ProjectService } from '../../services/project.service.ee';
export declare class CredentialsPermissionChecker {
    private readonly sharedCredentialsRepository;
    private readonly credentialsRepository;
    private readonly ownershipService;
    private readonly projectService;
    private readonly nodeTypes;
    private readonly userRepository;
    private readonly credentialsFinderService;
    private readonly logger;
    constructor(sharedCredentialsRepository: SharedCredentialsRepository, credentialsRepository: CredentialsRepository, ownershipService: OwnershipService, projectService: ProjectService, nodeTypes: NodeTypes, userRepository: UserRepository, credentialsFinderService: CredentialsFinderService, logger: Logger);
    checkForUser(userId: string, nodes: INode[]): Promise<void>;
    findInaccessibleForUser(userId: string, nodes: INode[], workflowId: string): Promise<Array<{
        id: string;
        name: string;
        exists: boolean;
    }>>;
    private cachedCredentialName;
    private findUnusable;
    private static flatten;
    private partitionByUsageScope;
    resolveInaccessibleCredentialIdsForUserId(userId: string, credentialIds: string[], options?: {
        ignoreGlobalUseScope?: boolean;
    }): Promise<string[]>;
    resolveInaccessibleCredentialIdsForUser(user: User, credentialIds: string[], options?: {
        ignoreGlobalUseScope?: boolean;
    }): Promise<string[]>;
    private loadUserWithRole;
    check(workflowId: string, nodes: INode[], actingUserId?: string): Promise<void>;
    findInaccessible(workflowId: string, credentialIds: string[], actingUserId?: string): Promise<{
        homeProject: Project;
        inaccessibleIds: string[];
        unusableForActingUser: UnusableCredential[];
    }>;
    findUnusableInWorkflow(workflowId: string, credentialIds: string[], userId: string): Promise<UnusableCredential[]>;
    private findCarried;
    getCredentialIdsForNodes(nodes: INode[]): string[];
    private mapCredIdsToNodes;
    private getActiveCredentialTypes;
}
