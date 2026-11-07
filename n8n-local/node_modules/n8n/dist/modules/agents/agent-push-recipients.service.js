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
exports.AgentPushRecipientsService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
let AgentPushRecipientsService = class AgentPushRecipientsService {
    constructor(userRepository, roleService) {
        this.userRepository = userRepository;
        this.roleService = roleService;
    }
    async getProjectReaders(projectId) {
        return await this.getProjectUsersWithScope(projectId, 'agent:read');
    }
    async getProjectUsersWithScope(projectId, scope) {
        const [globalRoleSlugs, projectRoleSlugs] = await Promise.all([
            this.roleService.rolesWithScope('global', [scope]),
            this.roleService.rolesWithScope('project', [scope]),
        ]);
        return await this.userRepository.findIdsWithGlobalOrProjectRoles({
            projectIds: [projectId],
            projectRoleSlugs,
            globalRoleSlugs,
        });
    }
};
exports.AgentPushRecipientsService = AgentPushRecipientsService;
exports.AgentPushRecipientsService = AgentPushRecipientsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.UserRepository, backend_services_1.RoleService])
], AgentPushRecipientsService);
//# sourceMappingURL=agent-push-recipients.service.js.map