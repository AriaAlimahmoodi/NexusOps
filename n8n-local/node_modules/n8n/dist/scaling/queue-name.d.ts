import type { WorkerPoolConfig } from '@n8n/config';
import type { InstanceSettings } from 'n8n-core';
export declare const DEFAULT_QUEUE_NAME = "jobs";
type InstanceType = InstanceSettings['instanceType'];
export declare function resolveWorkerPoolName(pool: WorkerPoolConfig): string;
export declare function resolveQueueName(instanceType: InstanceType, poolName: string): string;
export declare function poolQueueName(poolName: string | undefined): string;
export {};
