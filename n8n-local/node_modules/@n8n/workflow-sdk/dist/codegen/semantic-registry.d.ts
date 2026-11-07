import type { NodeJSON } from '../types/base';
export type CompositeType = 'ifElse' | 'switchCase' | 'merge' | 'splitInBatches';
export interface NodeSemantics {
    outputs: string[] | ((node: NodeJSON) => string[]);
    inputs: string[] | ((node: NodeJSON) => string[]);
    cycleOutput?: string;
    composite?: CompositeType;
}
export declare function getOutputName(type: string, index: number, node: NodeJSON): string;
export declare function getInputName(type: string, index: number, node: NodeJSON): string;
export declare function getCompositeType(type: string): CompositeType | undefined;
export declare function getNodeSemantics(type: string, node: NodeJSON): {
    outputs: string[];
    inputs: string[];
    cycleOutput?: string;
    composite?: CompositeType;
} | undefined;
export declare function isCycleOutput(type: string, outputName: string): boolean;
