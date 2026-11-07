"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisExecutionResponseSender = createRedisExecutionResponseSender;
exports.startRedisExecutionResponseReceiver = startRedisExecutionResponseReceiver;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
async function createChannelNameGenerator() {
    const { RedisClientService } = await import('@n8n/backend-services');
    const prefix = di_1.Container.get(RedisClientService).toValidPrefix(di_1.Container.get(config_1.GlobalConfig).redis.prefix);
    const channelPrefix = `${prefix}:engine-v2-responses`;
    return (executionId) => `${channelPrefix}:${executionId}`;
}
async function createRedisExecutionResponseSender(logger) {
    const { RedisClientService } = await import('@n8n/backend-services');
    const { RedisExecutionResponseSender } = await import('./redis-execution-response-sender.js');
    return new RedisExecutionResponseSender(di_1.Container.get(RedisClientService).createClient({ type: 'publisher(n8n)' }), await createChannelNameGenerator(), logger);
}
async function startRedisExecutionResponseReceiver(logger) {
    const { RedisClientService } = await import('@n8n/backend-services');
    const { RedisExecutionResponseReceiver } = await import('./redis-execution-response-receiver.js');
    const receiver = new RedisExecutionResponseReceiver(di_1.Container.get(RedisClientService).createClient({ type: 'subscriber(n8n)' }), await createChannelNameGenerator(), logger);
    try {
        await receiver.start();
    }
    catch (error) {
        await receiver.stop();
        throw error;
    }
    return receiver;
}
//# sourceMappingURL=redis-execution-response-channel.js.map