import { GetNodeTypesByIdentifierRequestDto } from '@n8n/api-types';
import { GlobalConfig } from '@n8n/config';
import { Request } from 'express';
import type { INodeTypeDescription } from 'n8n-workflow';
import { NodeTypes } from '../node-types';
export declare class NodeTypesController {
    private readonly nodeTypes;
    private readonly globalConfig;
    constructor(nodeTypes: NodeTypes, globalConfig: GlobalConfig);
    getNodeInfo(req: Request): Promise<INodeTypeDescription[]>;
    getNodeTypesByIdentifier(payload: GetNodeTypesByIdentifierRequestDto): Promise<INodeTypeDescription[]>;
}
