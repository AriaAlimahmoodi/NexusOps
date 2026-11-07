import type { SemanticNode } from './types';
interface CompositeNodeBase {
    kind: string;
}
export interface LeafNode extends CompositeNodeBase {
    kind: 'leaf';
    node: SemanticNode;
    errorHandler?: CompositeNode;
}
export interface ChainNode extends CompositeNodeBase {
    kind: 'chain';
    nodes: CompositeNode[];
}
export interface VariableReference extends CompositeNodeBase {
    kind: 'varRef';
    varName: string;
    nodeName: string;
}
export interface IfElseCompositeNode extends CompositeNodeBase {
    kind: 'ifElse';
    ifNode: SemanticNode;
    trueBranch: CompositeNode | CompositeNode[] | null;
    falseBranch: CompositeNode | CompositeNode[] | null;
    errorHandler?: CompositeNode;
}
export interface SwitchCaseCompositeNode extends CompositeNodeBase {
    kind: 'switchCase';
    switchNode: SemanticNode;
    cases: Array<CompositeNode | CompositeNode[] | null>;
    caseIndices: number[];
}
export interface MergeCompositeNode extends CompositeNodeBase {
    kind: 'merge';
    mergeNode: SemanticNode;
    branches: CompositeNode[];
    inputIndices: number[];
}
export interface SplitInBatchesCompositeNode extends CompositeNodeBase {
    kind: 'splitInBatches';
    sibNode: SemanticNode;
    doneChain: CompositeNode | CompositeNode[] | null;
    loopChain: CompositeNode | CompositeNode[] | null;
}
export interface FanOutCompositeNode extends CompositeNodeBase {
    kind: 'fanOut';
    sourceNode: CompositeNode;
    targets: CompositeNode[];
}
export interface ExplicitConnection {
    sourceNode: string;
    sourceOutput: number;
    targetNode: string;
    targetInput: number;
}
export interface ExplicitConnectionsNode extends CompositeNodeBase {
    kind: 'explicitConnections';
    nodes: SemanticNode[];
    connections: ExplicitConnection[];
}
export interface MultiOutputNode extends CompositeNodeBase {
    kind: 'multiOutput';
    sourceNode: SemanticNode;
    outputTargets: Map<number, CompositeNode>;
}
export type CompositeNode = LeafNode | ChainNode | VariableReference | IfElseCompositeNode | SwitchCaseCompositeNode | MergeCompositeNode | SplitInBatchesCompositeNode | FanOutCompositeNode | ExplicitConnectionsNode | MultiOutputNode;
export interface DeferredInputConnection {
    targetNode: SemanticNode;
    targetInputIndex: number;
    sourceNodeName: string;
    sourceOutputIndex: number;
    isErrorOutput?: boolean;
}
export interface DeferredMergeDownstream {
    mergeNode: SemanticNode;
    downstreamChain: CompositeNode | null;
}
export interface CompositeTree {
    roots: CompositeNode[];
    variables: Map<string, SemanticNode>;
    deferredConnections: DeferredInputConnection[];
    deferredMergeDownstreams: DeferredMergeDownstream[];
}
export {};
