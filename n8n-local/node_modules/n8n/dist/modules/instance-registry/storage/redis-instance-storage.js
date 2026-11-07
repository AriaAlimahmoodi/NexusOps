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
exports.RedisInstanceStorage = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const instance_registry_types_1 = require("../instance-registry.types");
const lua_scripts_1 = require("./lua-scripts");
let RedisInstanceStorage = class RedisInstanceStorage {
    constructor(logger, globalConfig, redisClientService) {
        this.kind = 'redis';
        this.logger = logger.scoped(['instance-registry', 'redis']);
        this.redisPrefix = globalConfig.redis.prefix;
        this.redisClient = redisClientService.createClient({
            type: 'registry(n8n)',
            extraOptions: { commandTimeout: instance_registry_types_1.REGISTRY_CONSTANTS.OPERATION_TIMEOUT_MS },
        });
    }
    async register(registration) {
        await this.upsertRegistration(registration);
    }
    async heartbeat(registration) {
        try {
            await this.upsertRegistration(registration);
        }
        catch (error) {
            this.logger.warn('Failed to heartbeat instance', {
                instanceKey: registration.instanceKey,
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
    }
    async unregister(instanceKey) {
        try {
            await this.redisClient.eval(lua_scripts_1.UNREGISTER_SCRIPT, 2, this.instanceKey(instanceKey), this.membershipSetKey());
        }
        catch (error) {
            this.logger.warn('Failed to unregister instance', {
                instanceKey,
                error: (0, ensure_error_1.ensureError)(error).message,
            });
        }
    }
    async getAllRegistrations() {
        const raw = await this.redisClient.eval(lua_scripts_1.READ_ALL_SCRIPT, 1, this.membershipSetKey());
        if (!Array.isArray(raw))
            return [];
        const results = raw.filter((item) => typeof item === 'string');
        return results
            .map((json) => {
            try {
                const parsed = api_types_1.instanceRegistrationSchema.safeParse((0, n8n_workflow_1.jsonParse)(json));
                if (!parsed.success) {
                    this.logger.warn('Skipping invalid registration entry', {
                        error: parsed.error.message,
                    });
                    return null;
                }
                return parsed.data;
            }
            catch (error) {
                this.logger.warn('Skipping malformed registration entry', {
                    error: (0, ensure_error_1.ensureError)(error).message,
                });
                return null;
            }
        })
            .filter((r) => r !== null);
    }
    async getRegistration(instanceKey) {
        try {
            const json = await this.redisClient.get(this.instanceKey(instanceKey));
            if (json === null)
                return null;
            const parsed = api_types_1.instanceRegistrationSchema.safeParse((0, n8n_workflow_1.jsonParse)(json));
            if (!parsed.success) {
                this.logger.warn('Invalid registration data', {
                    instanceKey,
                    error: parsed.error.message,
                });
                return null;
            }
            return parsed.data;
        }
        catch (error) {
            this.logger.warn('Failed to get registration', {
                instanceKey,
                error: (0, ensure_error_1.ensureError)(error).message,
            });
            return null;
        }
    }
    async getLastKnownState() {
        const json = await this.redisClient.get(this.stateKey());
        if (json === null)
            return new Map();
        const record = (0, n8n_workflow_1.jsonParse)(json);
        const state = new Map();
        for (const [key, value] of Object.entries(record)) {
            const parsed = api_types_1.instanceRegistrationSchema.safeParse(value);
            if (parsed.success) {
                state.set(key, parsed.data);
            }
            else {
                this.logger.warn('Skipping invalid state entry', {
                    instanceKey: key,
                    error: parsed.error.message,
                });
            }
        }
        return state;
    }
    async saveLastKnownState(state) {
        const record = Object.fromEntries(state);
        await this.redisClient.set(this.stateKey(), (0, n8n_workflow_1.jsonStringify)(record), 'EX', instance_registry_types_1.REGISTRY_CONSTANTS.STATE_TTL_SECONDS);
    }
    async cleanupStaleMembers() {
        const removed = await this.redisClient.eval(lua_scripts_1.CLEANUP_SCRIPT, 1, this.membershipSetKey());
        return typeof removed === 'number' ? removed : 0;
    }
    async destroy() {
        this.redisClient.disconnect();
    }
    async upsertRegistration(registration) {
        await this.redisClient.eval(lua_scripts_1.REGISTER_SCRIPT, 2, this.instanceKey(registration.instanceKey), this.membershipSetKey(), (0, n8n_workflow_1.jsonStringify)(registration), String(instance_registry_types_1.REGISTRY_CONSTANTS.REGISTRATION_TTL_SECONDS));
    }
    instanceKey(key) {
        return instance_registry_types_1.REDIS_KEY_PATTERNS.instanceKey(this.redisPrefix, key);
    }
    membershipSetKey() {
        return instance_registry_types_1.REDIS_KEY_PATTERNS.membershipSet(this.redisPrefix);
    }
    stateKey() {
        return instance_registry_types_1.REDIS_KEY_PATTERNS.stateKey(this.redisPrefix);
    }
};
exports.RedisInstanceStorage = RedisInstanceStorage;
exports.RedisInstanceStorage = RedisInstanceStorage = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, backend_services_1.RedisClientService])
], RedisInstanceStorage);
//# sourceMappingURL=redis-instance-storage.js.map