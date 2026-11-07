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
exports.LeaderElectionClient = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const result_1 = require("@n8n/utils/result");
const backend_services_1 = require("@n8n/backend-services");
const COMMAND_TIMEOUT_MS = 5_000;
const INCREASE_TTL_IF_LEADER = `
-- Renew only if we still hold the lock
local currentValue = redis.call("GET", KEYS[1])

if not currentValue then
  return -1
end

if currentValue ~= ARGV[1] then
  return currentValue
end

return redis.call("EXPIRE", KEYS[1], tonumber(ARGV[2]))
`;
let LeaderElectionClient = class LeaderElectionClient {
    get hostId() {
        return this.instanceSettings.hostId;
    }
    constructor(instanceSettings, globalConfig, redisClientService) {
        this.instanceSettings = instanceSettings;
        const prefix = redisClientService.toValidPrefix(globalConfig.redis.prefix);
        this.leaderKey = prefix + ':main_instance_leader';
        this.leaderKeyTtlInS = globalConfig.multiMainSetup.ttl;
        this.redisClient = redisClientService.createClient({
            type: 'leader(n8n)',
            extraOptions: { commandTimeout: COMMAND_TIMEOUT_MS },
        });
    }
    async getLeader() {
        try {
            return (0, result_1.createResultOk)(await this.redisClient.get(this.leaderKey));
        }
        catch (e) {
            return (0, result_1.createResultError)((0, ensure_error_1.ensureError)(e));
        }
    }
    async setLeaderIfNotExists() {
        try {
            const result = await this.redisClient.set(this.leaderKey, this.hostId, 'EX', this.leaderKeyTtlInS, 'NX');
            return (0, result_1.createResultOk)(result === 'OK');
        }
        catch (e) {
            return (0, result_1.createResultError)((0, ensure_error_1.ensureError)(e));
        }
    }
    async tryRenewLeaderTtl() {
        try {
            const result = await this.redisClient.eval(INCREASE_TTL_IF_LEADER, 1, this.leaderKey, this.hostId, this.leaderKeyTtlInS);
            if (result === -1 || result === 0) {
                return (0, result_1.createResultOk)({ id: 'key-missing' });
            }
            if (result === 1) {
                return (0, result_1.createResultOk)({ id: 'success' });
            }
            if (typeof result === 'string') {
                return (0, result_1.createResultOk)({ id: 'other-host-is-leader', currentLeaderId: result });
            }
            return (0, result_1.createResultError)(new Error(`Unexpected result from Redis script: ${JSON.stringify(result)}`));
        }
        catch (e) {
            return (0, result_1.createResultError)((0, ensure_error_1.ensureError)(e));
        }
    }
    async clearLeader() {
        try {
            await this.redisClient.del(this.leaderKey);
            return (0, result_1.createResultOk)(undefined);
        }
        catch (e) {
            return (0, result_1.createResultError)((0, ensure_error_1.ensureError)(e));
        }
    }
    destroy() {
        this.redisClient.disconnect();
    }
};
exports.LeaderElectionClient = LeaderElectionClient;
exports.LeaderElectionClient = LeaderElectionClient = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings, config_1.GlobalConfig, backend_services_1.RedisClientService])
], LeaderElectionClient);
//# sourceMappingURL=leader-election-client.js.map