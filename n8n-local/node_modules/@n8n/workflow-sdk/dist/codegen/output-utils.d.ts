import type { SemanticNode } from './types';
export interface OutputTargetInfo {
    targetName: string;
    targetInputSlot: string;
}
export declare function getAllOutputTargets(node: SemanticNode): string[];
export declare function hasMultipleOutputSlots(node: SemanticNode): boolean;
export declare function hasConsecutiveOutputSlots(node: SemanticNode): boolean;
export declare function hasNonZeroOutputIndex(node: SemanticNode): boolean;
export declare function getOutputTargetsByIndex(node: SemanticNode): Map<number, OutputTargetInfo[]>;
