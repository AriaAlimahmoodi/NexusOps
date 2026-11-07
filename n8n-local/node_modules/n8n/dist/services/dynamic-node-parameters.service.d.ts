import { Logger } from '@n8n/backend-common';
import { CredentialsRepository, SharedWorkflowRepository, User } from '@n8n/db';
import type { ILoadOptions, INodeListSearchResult, INodePropertyOptions, IWorkflowExecuteAdditionalData, ResourceMapperFields, INodeCredentials, INodeParameters, INodeTypeNameVersion, NodeParameterValueType, IDataObject } from 'n8n-workflow';
import { CredentialsFinderService } from '@n8n/backend-services';
import { NodeTypes } from '../node-types';
import { WorkflowLoaderService } from './workflow-loader.service';
export declare class DynamicNodeParametersService {
    private logger;
    private nodeTypes;
    private workflowLoaderService;
    private sharedWorkflowRepository;
    private credentialsFinderService;
    private credentialsRepository;
    constructor(logger: Logger, nodeTypes: NodeTypes, workflowLoaderService: WorkflowLoaderService, sharedWorkflowRepository: SharedWorkflowRepository, credentialsFinderService: CredentialsFinderService, credentialsRepository: CredentialsRepository);
    refineResourceIds(user: User, payload: {
        projectId?: string;
        workflowId?: string;
        credentials?: INodeCredentials;
    }): Promise<void>;
    private assertMayUseEndUserCredentials;
    getOptionsViaMethodName(methodName: string, path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials): Promise<INodePropertyOptions[]>;
    getOptionsViaLoadOptionsByPath(path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials): Promise<INodePropertyOptions[]>;
    getOptionsViaLoadOptions(loadOptions: ILoadOptions, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials): Promise<INodePropertyOptions[]>;
    getResourceLocatorResults(methodName: string, path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials, filter?: string, paginationToken?: string): Promise<INodeListSearchResult>;
    getResourceMappingFields(methodName: string, path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, credentials?: INodeCredentials): Promise<ResourceMapperFields>;
    getLocalResourceMappingFields(methodName: string, path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion): Promise<ResourceMapperFields>;
    getActionResult(handler: string, path: string, additionalData: IWorkflowExecuteAdditionalData, nodeTypeAndVersion: INodeTypeNameVersion, currentNodeParameters: INodeParameters, payload: IDataObject | string | undefined, credentials?: INodeCredentials): Promise<NodeParameterValueType>;
    private getMethod;
    private getNodeType;
    private getWorkflow;
    private getThisArg;
    private getLocalLoadOptionsContext;
    private removeDuplicateResourceMappingFields;
}
