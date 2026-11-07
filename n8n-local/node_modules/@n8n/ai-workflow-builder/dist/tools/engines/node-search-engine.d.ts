import type { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import type { NodeSearchResult } from '../../types/nodes';
export declare const SCORE_WEIGHTS: {
    readonly CONNECTION_EXACT: 100;
    readonly CONNECTION_IN_EXPRESSION: 50;
};
export declare class NodeSearchEngine {
    private readonly nodeTypes;
    constructor(nodeTypes: INodeTypeDescription[]);
    searchByName(query: string, limit?: number): NodeSearchResult[];
    searchByConnectionType(connectionType: NodeConnectionType, limit?: number, nameFilter?: string): NodeSearchResult[];
    formatResult(result: NodeSearchResult): string;
    private getConnectionScore;
    static isAiConnectionType(connectionType: string): boolean;
    static getAiConnectionTypes(): NodeConnectionType[];
}
