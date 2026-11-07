import type { NodeInstance, NodeChain, TriggerInstance } from './base';
export type AnyNode = NodeInstance<string, string, unknown>;
export type AnyChain = NodeChain<AnyNode, AnyNode>;
export type AnyTrigger = TriggerInstance<string, string, unknown>;
export type NodeParameters = Record<string, unknown>;
