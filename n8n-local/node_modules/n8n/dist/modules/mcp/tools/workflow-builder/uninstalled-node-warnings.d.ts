export type FindUninstalledNodeTypes = (nodeTypes: string[]) => Promise<Array<{
    nodeType: string;
    packageName: string;
}>>;
export interface UninstalledNodeWarning {
    code: string;
    message: string;
    nodeName: string;
}
export declare function buildUninstalledNodeWarnings(nodes: Array<{
    name: string;
    type: string;
}>, findUninstalledNodeTypes?: FindUninstalledNodeTypes, installToolAvailable?: boolean): Promise<UninstalledNodeWarning[]>;
