import type { NodeTypeExamples, NodeTypeGuide, NodeTypePattern, PromptContext } from './types';
export declare function matchesPattern(nodeType: string, pattern: NodeTypePattern): boolean;
export declare function getMatchingGuides(context: PromptContext): NodeTypeGuide[];
export declare function getMatchingExamples(context: PromptContext): NodeTypeExamples[];
