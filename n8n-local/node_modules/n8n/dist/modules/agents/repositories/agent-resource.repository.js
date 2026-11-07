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
exports.AgentResourceRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const agent_resource_entity_1 = require("../entities/agent-resource.entity");
const CHAT_SESSION_GENERATION_KEY = 'chatSessionGeneration';
let AgentResourceRepository = class AgentResourceRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(agent_resource_entity_1.AgentResourceEntity, dataSource.manager);
    }
    async ensureExists(resourceId) {
        await this.createQueryBuilder()
            .insert()
            .into(agent_resource_entity_1.AgentResourceEntity)
            .values({ id: resourceId, metadata: null })
            .orIgnore()
            .execute();
    }
    async findChatSessionGeneration(baseThreadId) {
        const resource = await this.findOneBy({ id: baseThreadId });
        const value = parseMetadata(resource?.metadata)[CHAT_SESSION_GENERATION_KEY];
        return isChatSessionGeneration(value) ? value : null;
    }
    async saveChatSessionGeneration(baseThreadId, session) {
        const resource = await this.findOneBy({ id: baseThreadId });
        const metadata = {
            ...parseMetadata(resource?.metadata),
            [CHAT_SESSION_GENERATION_KEY]: session,
        };
        await this.upsert({ id: baseThreadId, metadata: JSON.stringify(metadata) }, ['id']);
    }
};
exports.AgentResourceRepository = AgentResourceRepository;
exports.AgentResourceRepository = AgentResourceRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AgentResourceRepository);
function parseMetadata(value) {
    if (!value)
        return {};
    const parsed = (0, n8n_workflow_1.jsonParse)(value, { fallbackValue: {} });
    return (0, is_record_1.isRecord)(parsed) ? parsed : {};
}
function isChatSessionGeneration(value) {
    return ((0, is_record_1.isRecord)(value) &&
        typeof value.generation === 'number' &&
        typeof value.lastActivityAt === 'number');
}
//# sourceMappingURL=agent-resource.repository.js.map