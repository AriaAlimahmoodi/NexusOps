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
exports.AgentChannelStatusRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_core_1 = require("n8n-core");
const agent_channel_status_entity_1 = require("../entities/agent-channel-status.entity");
const CONFLICT_PATHS = ['agentId', 'integrationType', 'credentialId', 'hostId'];
const MAX_ERROR_MESSAGE_LENGTH = 1024;
let AgentChannelStatusRepository = class AgentChannelStatusRepository extends typeorm_1.Repository {
    constructor(dataSource, instanceSettings) {
        super(agent_channel_status_entity_1.AgentChannelStatus, dataSource.manager);
        this.instanceSettings = instanceSettings;
    }
    async saveOwn(ref, observation) {
        await this.upsert({
            ...this.own(ref),
            ...observation,
            errorMessage: observation.errorMessage?.slice(0, MAX_ERROR_MESSAGE_LENGTH) ?? null,
            updatedAt: new Date(),
        }, [...CONFLICT_PATHS]);
    }
    async refreshOwnLease(ref, expiresAt) {
        await this.update(this.own(ref), { expiresAt, updatedAt: new Date() });
    }
    async clearOwnChannel(ref) {
        await this.delete(this.own(ref));
    }
    async clearOwnHost() {
        await this.delete({ hostId: this.instanceSettings.hostId });
    }
    async findOwnChannel(ref) {
        return await this.findOneBy(this.own(ref));
    }
    async findOwnAll() {
        return await this.findBy({ hostId: this.instanceSettings.hostId });
    }
    async findByAgentId(agentId) {
        return await this.findBy({ agentId });
    }
    async deleteExpired(now) {
        const { affected } = await this.delete({ expiresAt: (0, typeorm_1.LessThan)(now) });
        return affected ?? 0;
    }
    own(ref) {
        return { ...ref, hostId: this.instanceSettings.hostId };
    }
};
exports.AgentChannelStatusRepository = AgentChannelStatusRepository;
exports.AgentChannelStatusRepository = AgentChannelStatusRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, n8n_core_1.InstanceSettings])
], AgentChannelStatusRepository);
//# sourceMappingURL=agent-channel-status.repository.js.map