import type { GraphNode } from '../types/base';
import type { PluginRegistry } from './plugins/registry';
export declare function findMapKeyForNodeId(nodeId: string, nodes: ReadonlyMap<string, GraphNode>): string | undefined;
export declare function resolveTargetNodeName(target: unknown, nodes: ReadonlyMap<string, GraphNode>, registry: PluginRegistry, nameMapping?: Map<string, string>): string | undefined;
