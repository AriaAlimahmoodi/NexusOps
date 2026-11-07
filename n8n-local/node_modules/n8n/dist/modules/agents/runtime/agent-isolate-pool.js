"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentIsolatePool = exports.AgentIsolateSlot = exports.PoolExhaustedError = exports.PoolDisposedError = void 0;
const sandbox_polyfills_1 = require("./sandbox-polyfills");
class PoolDisposedError extends Error {
    constructor() {
        super('Agent isolate pool is disposed');
        this.name = 'PoolDisposedError';
    }
}
exports.PoolDisposedError = PoolDisposedError;
class PoolExhaustedError extends Error {
    constructor() {
        super('Agent isolate pool is exhausted — too many concurrent requests. Try again later.');
        this.name = 'PoolExhaustedError';
    }
}
exports.PoolExhaustedError = PoolExhaustedError;
class AgentIsolateSlot {
    constructor(ivmModule, memoryLimit, libraryBundle) {
        this.isolate = new ivmModule.Isolate({ memoryLimit });
        this.bundleScript = this.isolate.compileScriptSync(libraryBundle);
    }
    get isHealthy() {
        return !this.isolate.isDisposed;
    }
    createContext() {
        const context = this.isolate.createContextSync();
        try {
            const jail = context.global;
            jail.setSync('global', jail.derefInto());
            context.evalSync(sandbox_polyfills_1.SANDBOX_POLYFILLS, { timeout: 5000 });
            context.evalSync(`
				globalThis.__modules = {};
				globalThis.require = function(id) {
					if (globalThis.__modules[id]) {
						return globalThis.__modules[id];
					}
					// Return empty stub for unknown modules (Node built-ins, etc.)
					return new Proxy({}, {
						get: function(target, prop) {
							if (prop === '__esModule') return false;
							if (prop === 'default') return {};
							return function() { return {}; };
						}
					});
				};
			`, { timeout: 5000 });
            this.bundleScript.runSync(context, { timeout: 10000 });
            return context;
        }
        catch (e) {
            context.release();
            throw e;
        }
    }
    dispose() {
        if (this.isHealthy) {
            this.bundleScript.release();
            this.isolate.dispose();
        }
    }
}
exports.AgentIsolateSlot = AgentIsolateSlot;
class AgentIsolatePool {
    constructor(ivmModule, libraryBundle, options = {}) {
        this.ivmModule = ivmModule;
        this.libraryBundle = libraryBundle;
        this.slots = [];
        this.waitQueue = [];
        this.disposed = false;
        this.warming = 0;
        this.replenishPromises = new Set();
        this.size = options.size ?? 2;
        this.memoryLimit = options.memoryLimit ?? 32;
        this.highWaterMarkRatio = options.highWaterMarkRatio ?? 0.8;
        this.maxQueueDepth = options.maxQueueDepth ?? 10;
        this.logger = options.logger;
    }
    async initialize() {
        const results = await Promise.allSettled(Array.from({ length: this.size }, async () => await Promise.resolve(this.createSlot())));
        for (const result of results) {
            if (result.status === 'fulfilled') {
                this.slots.push(result.value);
            }
            else {
                this.logger?.warn('[AgentIsolatePool] Failed to create slot during init', {
                    error: result.reason instanceof Error ? result.reason.message : String(result.reason),
                });
            }
        }
        if (this.slots.length === 0) {
            const firstRejection = results.find((r) => r.status === 'rejected');
            const cause = firstRejection?.reason instanceof Error
                ? firstRejection.reason
                : new Error(String(firstRejection?.reason));
            throw new Error('AgentIsolatePool: failed to create any isolate slots during initialization', { cause });
        }
        const missing = this.size - this.slots.length;
        for (let i = 0; i < missing; i++) {
            void this.replenish();
        }
    }
    async acquire() {
        if (this.disposed)
            throw new PoolDisposedError();
        const slot = this.slots.shift();
        if (slot) {
            void this.replenish();
            return slot;
        }
        if (this.waitQueue.length >= this.maxQueueDepth) {
            this.logger?.warn('[AgentIsolatePool] Pool exhausted — request rejected', {
                queueDepth: this.waitQueue.length,
                maxQueueDepth: this.maxQueueDepth,
            });
            throw new PoolExhaustedError();
        }
        return await new Promise((resolve, reject) => {
            this.waitQueue.push({ resolve, reject });
        });
    }
    release(slot) {
        if (this.disposed) {
            slot.dispose();
            return;
        }
        if (!slot.isHealthy) {
            this.logger?.warn('[AgentIsolatePool] Slot OOM — discarding and replenishing');
            slot.dispose();
            void this.replenish();
            return;
        }
        if (this.isOverHighWaterMark(slot)) {
            this.logger?.debug('[AgentIsolatePool] Slot over high-water mark — proactively recycling');
            slot.dispose();
            void this.replenish();
            return;
        }
        const waiter = this.waitQueue.shift();
        if (waiter) {
            waiter.resolve(slot);
            return;
        }
        this.slots.push(slot);
    }
    tryAcquireSync() {
        if (this.disposed)
            return null;
        const slot = this.slots.shift();
        if (slot) {
            void this.replenish();
            return slot;
        }
        return null;
    }
    async dispose() {
        this.disposed = true;
        const error = new PoolDisposedError();
        for (const { reject } of this.waitQueue) {
            reject(error);
        }
        this.waitQueue = [];
        await Promise.all([...this.replenishPromises]);
        for (const slot of this.slots) {
            slot.dispose();
        }
        this.slots = [];
    }
    isOverHighWaterMark(slot) {
        try {
            const stats = slot.isolate.getHeapStatisticsSync();
            const limitBytes = this.memoryLimit * 1024 * 1024;
            return stats.used_heap_size > limitBytes * this.highWaterMarkRatio;
        }
        catch (error) {
            this.logger?.warn('[AgentIsolatePool] Failed to get heap statistics — assuming over high-water mark', {
                error: error instanceof Error ? error.message : String(error),
            });
            return true;
        }
    }
    createSlot() {
        return new AgentIsolateSlot(this.ivmModule, this.memoryLimit, this.libraryBundle);
    }
    replenish(attempt = 0) {
        if (this.disposed)
            return;
        if (this.slots.length + this.warming >= this.size)
            return;
        this.warming++;
        let promise;
        promise = Promise.resolve()
            .then(() => {
            const slot = this.createSlot();
            this.warming--;
            this.replenishPromises.delete(promise);
            if (this.disposed) {
                slot.dispose();
                return;
            }
            const waiter = this.waitQueue.shift();
            if (waiter) {
                waiter.resolve(slot);
                void this.replenish();
            }
            else {
                this.slots.push(slot);
            }
        })
            .catch((error) => {
            this.warming--;
            this.replenishPromises.delete(promise);
            if (attempt < AgentIsolatePool.MAX_REPLENISH_RETRIES) {
                const delay = AgentIsolatePool.REPLENISH_RETRY_BASE_MS * 2 ** attempt;
                this.logger?.debug('[AgentIsolatePool] Replenishment failed, retrying', {
                    attempt,
                    delayMs: delay,
                    error: error instanceof Error ? error.message : String(error),
                });
                let retryPromise;
                retryPromise = new Promise((resolve) => {
                    setTimeout(resolve, delay).unref();
                }).then(() => {
                    this.replenishPromises.delete(retryPromise);
                    this.replenish(attempt + 1);
                });
                this.replenishPromises.add(retryPromise);
            }
            else {
                this.logger?.warn('[AgentIsolatePool] Replenishment failed after max retries', {
                    error: error instanceof Error ? error.message : String(error),
                });
                const waitError = new Error('Isolate slot creation permanently failed — no slots available');
                for (const { reject } of this.waitQueue.splice(0)) {
                    reject(waitError);
                }
            }
        });
        this.replenishPromises.add(promise);
    }
}
exports.AgentIsolatePool = AgentIsolatePool;
AgentIsolatePool.MAX_REPLENISH_RETRIES = 3;
AgentIsolatePool.REPLENISH_RETRY_BASE_MS = 500;
//# sourceMappingURL=agent-isolate-pool.js.map