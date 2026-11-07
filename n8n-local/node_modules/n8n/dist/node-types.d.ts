import { Logger } from '@n8n/backend-common';
import type { NeededNodeType } from '@n8n/task-runner';
import type { INodeType, INodeTypeDescription, INodeTypes, IVersionedNodeType } from 'n8n-workflow';
import { LoadNodesAndCredentials } from './load-nodes-and-credentials';
export declare class NodeTypes implements INodeTypes {
    private readonly logger;
    private readonly loadNodesAndCredentials;
    constructor(logger: Logger, loadNodesAndCredentials: LoadNodesAndCredentials);
    resolveBaseName(nodeTypeName: string): {
        baseName: string;
        isSyntheticTool: boolean;
    };
    getWithSourcePath(nodeTypeName: string, version: number): {
        description: INodeTypeDescription;
    } & {
        sourcePath: string;
    };
    getDescriptionWithTranslation(nodeTypeName: string, version: number, locale: string): Promise<INodeTypeDescription>;
    getByName(nodeType: string): INodeType | IVersionedNodeType;
    getByNameAndVersion(nodeType: string, version?: number): INodeType;
    getKnownTypes(): Record<string, import("n8n-workflow").LoadingDetails>;
    getSupportedVersions(nodeTypeName: string): number[] | undefined;
    getNodeTranslationPath({ nodeSourcePath, longNodeType, locale, }: {
        nodeSourcePath: string;
        longNodeType: string;
        locale: string;
    }): Promise<string>;
    private getMaxVersion;
    private isVersionedDirname;
    getNodeTypeDescriptions(nodeTypes: NeededNodeType[]): INodeTypeDescription[];
    private buildSyntheticToolDescription;
}
