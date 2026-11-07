export declare const RESERVED_KEYWORDS: Set<string>;
export interface VarNameContext {
    nodeNameToVarName: Map<string, string>;
    usedVarNames: Set<string>;
}
export declare function toVarName(nodeName: string): string;
export declare function getVarName(nodeName: string, ctx: VarNameContext): string;
export declare function getUniqueVarName(nodeName: string, ctx: VarNameContext): string;
