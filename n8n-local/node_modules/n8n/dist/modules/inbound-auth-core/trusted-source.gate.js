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
exports.TrustedSourceDbGate = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const trusted_source_identity_repository_1 = require("./database/repositories/trusted-source-identity.repository");
const grant_authorization_1 = require("./grant-authorization");
let TrustedSourceDbGate = class TrustedSourceDbGate extends inbound_auth_1.TrustedSourceGate {
    constructor(logger, userRepository, workflowFinderService, identityRepository) {
        super();
        this.logger = logger;
        this.userRepository = userRepository;
        this.workflowFinderService = workflowFinderService;
        this.identityRepository = identityRepository;
    }
    async authorizeSealed({ userId, grant, binding, }) {
        const user = await this.userRepository.findByIdWithRole(userId);
        if (!user || user.disabled) {
            this.logger.debug('Sealed identity denied: the user is missing or disabled', { userId });
            return false;
        }
        if (binding) {
            const row = await this.identityRepository.findBinding(binding.sourceId, binding.subject);
            if (row?.status !== 'active' || row.userId !== userId) {
                this.logger.debug('Sealed identity denied: the binding is not active for this user', {
                    userId,
                    sourceId: binding.sourceId,
                    status: row?.status ?? 'missing',
                });
                return false;
            }
        }
        return await (0, grant_authorization_1.authorizeAgainstGrant)(this.workflowFinderService, grant, user);
    }
};
exports.TrustedSourceDbGate = TrustedSourceDbGate;
exports.TrustedSourceDbGate = TrustedSourceDbGate = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.UserRepository, workflow_finder_service_1.WorkflowFinderService, trusted_source_identity_repository_1.TrustedSourceIdentityRepository])
], TrustedSourceDbGate);
//# sourceMappingURL=trusted-source.gate.js.map