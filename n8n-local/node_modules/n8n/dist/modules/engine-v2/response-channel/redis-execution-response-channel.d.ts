import type { Logger } from '@n8n/backend-common';
export type RedisExecutionResponseChannelNameGenerator = (executionId: string) => string;
export declare function createRedisExecutionResponseSender(logger: Logger): Promise<import("./redis-execution-response-sender.js").RedisExecutionResponseSender>;
export declare function startRedisExecutionResponseReceiver(logger: Logger): Promise<import("./redis-execution-response-receiver.js").RedisExecutionResponseReceiver>;
