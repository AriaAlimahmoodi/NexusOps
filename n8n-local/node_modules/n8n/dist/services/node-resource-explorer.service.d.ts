import { Logger } from '@n8n/backend-common';
import { ProjectRepository, type User } from '@n8n/db';
import type { ExploreResourcesParams, ExploreResourcesResult } from '@n8n/instance-ai';
import { CredentialsFinderService } from '@n8n/backend-services';
import { NodeTypes } from '../node-types';
import { DynamicNodeParametersService } from '../services/dynamic-node-parameters.service';
export declare class NodeResourceExplorerService {
    private readonly logger;
    private readonly dynamicNodeParametersService;
    private readonly credentialsFinderService;
    private readonly projectRepository;
    private readonly nodeTypes;
    constructor(logger: Logger, dynamicNodeParametersService: DynamicNodeParametersService, credentialsFinderService: CredentialsFinderService, projectRepository: ProjectRepository, nodeTypes: NodeTypes);
    exploreResources(user: User, params: ExploreResourcesParams): Promise<ExploreResourcesResult>;
    private resolveExploreCredentials;
    findUnavailableResourceLocatorValues(user: User, params: {
        nodeType: string;
        version: number;
        credentialType: string;
        credentialId: string;
        parameters: Record<string, unknown>;
    }): Promise<UnavailableResourceLocatorValue[]>;
    private listAllReachableValues;
    private getNodeDescription;
}
export interface UnavailableResourceLocatorValue {
    name: string;
    displayName: string;
    currentValue: string;
}
