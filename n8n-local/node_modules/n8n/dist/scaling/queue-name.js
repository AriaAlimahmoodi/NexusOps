"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_QUEUE_NAME = void 0;
exports.resolveWorkerPoolName = resolveWorkerPoolName;
exports.resolveQueueName = resolveQueueName;
exports.poolQueueName = poolQueueName;
exports.DEFAULT_QUEUE_NAME = 'jobs';
function resolveWorkerPoolName(pool) {
    return pool.enabled ? pool.name : '';
}
function resolveQueueName(instanceType, poolName) {
    if (instanceType !== 'worker' || poolName === '')
        return exports.DEFAULT_QUEUE_NAME;
    return `${exports.DEFAULT_QUEUE_NAME}-${poolName}`;
}
function poolQueueName(poolName) {
    if (!poolName)
        return exports.DEFAULT_QUEUE_NAME;
    return `${exports.DEFAULT_QUEUE_NAME}-${poolName}`;
}
//# sourceMappingURL=queue-name.js.map