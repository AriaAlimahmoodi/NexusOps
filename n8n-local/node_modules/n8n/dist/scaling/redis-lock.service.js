"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisLockService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sleep_1 = require("@n8n/utils/sleep");
const node_crypto_1 = require("node:crypto");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const COMMAND_TIMEOUT_MS = 5_000;
const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
	return redis.call("del", KEYS[1])
else
	return 0
end
`;
const EXTENDED_RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("PEXPIRE", KEYS[1], ARGV[2])
else
    return 0
end
`;
let RedisLockService = class RedisLockService {
    constructor(logger, globalConfig, redisClientService) {
        this.logger = logger;
        const prefix = redisClientService.toValidPrefix(globalConfig.redis.prefix);
        this.lockPrefix = prefix + ':lock';
        this.redisClient = redisClientService.createClient({
            type: 'lock(n8n)',
            extraOptions: { commandTimeout: COMMAND_TIMEOUT_MS },
        });
    }
    buildLockKey(ns, key) {
        const hash = (0, node_crypto_1.createHash)('sha256').update(key).digest('hex');
        return `${this.lockPrefix}:${ns}:${hash}`;
    }
    async withLease(ns, key, fn, options) {
        const abortController = new AbortController();
        const lockKey = this.buildLockKey(ns, key);
        const lockValue = (0, node_crypto_1.randomUUID)();
        const lease = options?.leaseTtlMs ?? 30_000;
        let acquireErrorLogged = false;
        const acquireLock = async () => {
            try {
                const result = await this.redisClient.set(lockKey, lockValue, 'PX', lease, 'NX');
                return result === 'OK';
            }
            catch (error) {
                if (!acquireErrorLogged) {
                    this.logger.warn('Failed to acquire lock; retrying', { key, error: (0, ensure_error_1.ensureError)(error) });
                    acquireErrorLogged = true;
                }
                return false;
            }
        };
        const releaseLock = async () => {
            try {
                const result = await this.redisClient.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, lockValue);
                if (result !== 1) {
                    this.logger.warn('Lock was no longer held at release time', { key });
                }
            }
            catch (error) {
                this.logger.warn('Failed to release lock; relying on lease expiry', {
                    key,
                    error: (0, ensure_error_1.ensureError)(error),
                });
            }
        };
        const startWatchdog = () => {
            let lastRenewedAt = Date.now();
            const timer = setInterval(() => {
                void (async () => {
                    try {
                        const result = await this.redisClient.eval(EXTENDED_RELEASE_LOCK_SCRIPT, 1, lockKey, lockValue, lease);
                        if (result === 1) {
                            lastRenewedAt = Date.now();
                            return;
                        }
                        this.logger.warn('Lost lock during execution; stopping renewal', { key });
                        clearInterval(timer);
                        abortController.abort();
                    }
                    catch (error) {
                        if (Date.now() - lastRenewedAt >= lease) {
                            this.logger.warn('Lock renewal failing past lease window; aborting', {
                                key,
                                error: (0, ensure_error_1.ensureError)(error),
                            });
                            clearInterval(timer);
                            abortController.abort();
                        }
                        else {
                            this.logger.warn('Lock renewal failed; will retry', {
                                key,
                                error: (0, ensure_error_1.ensureError)(error),
                            });
                        }
                    }
                })();
            }, Math.max(1, Math.floor(lease / 3)));
            timer.unref();
            return timer;
        };
        const startTime = Date.now();
        while (true) {
            if (await acquireLock()) {
                const watchdog = startWatchdog();
                try {
                    return await fn(abortController.signal);
                }
                finally {
                    clearInterval(watchdog);
                    abortController.abort();
                    await releaseLock();
                }
            }
            if (options?.waitTimeoutMs !== undefined && Date.now() - startTime > options.waitTimeoutMs) {
                throw new backend_common_1.LockAcquisitionTimeoutError(`Timed out waiting for lock '${key}' in namespace '${ns}' after ${options.waitTimeoutMs}ms`);
            }
            const jitter = Math.floor(Math.random() * 50);
            await (0, sleep_1.sleep)(50 + jitter);
        }
    }
    destroy() {
        this.redisClient.disconnect();
    }
};
exports.RedisLockService = RedisLockService;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RedisLockService.prototype, "destroy", null);
exports.RedisLockService = RedisLockService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, backend_services_1.RedisClientService])
], RedisLockService);
//# sourceMappingURL=redis-lock.service.js.map