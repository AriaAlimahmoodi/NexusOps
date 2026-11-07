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
exports.AgentToolApprovalService = void 0;
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const n8n_workflow_1 = require("n8n-workflow");
const telemetry_2 = require("../../telemetry");
const execution_recorder_1 = require("./execution-recorder");
const agent_thread_grant_repository_1 = require("./repositories/agent-thread-grant.repository");
let AgentToolApprovalService = class AgentToolApprovalService {
    constructor(grants, telemetry) {
        this.grants = grants;
        this.telemetry = telemetry;
    }
    async createContext({ threadId, agentId, telemetry, source, }, toolRegistry) {
        const approvedKeys = await this.grants.findKeys(threadId);
        return {
            approvedKeys,
            getDisplayArgs: (toolName, input) => (0, execution_recorder_1.buildApprovalArgs)(input, toolRegistry?.get(toolName)),
            onDecision: async (grantKey, decision) => {
                if (telemetry) {
                    this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_RESPONDED_TO_AGENT_TOOL_APPROVAL, {
                        agent_id: agentId,
                        user_id: telemetry.userId,
                        run_type: telemetry.runType,
                        approved: decision.approved,
                        scope: decision.scope ?? 'once',
                        counts_by_source: { [source || 'unknown']: { count: 1 } },
                    });
                }
                if (!decision.approved || decision.scope !== 'session')
                    return;
                try {
                    await this.grants.grant(threadId, grantKey);
                }
                catch (error) {
                    throw new n8n_workflow_1.OperationalError('Could not save the session allowance. Try again.', {
                        cause: error,
                    });
                }
                approvedKeys.add(grantKey);
            },
        };
    }
};
exports.AgentToolApprovalService = AgentToolApprovalService;
exports.AgentToolApprovalService = AgentToolApprovalService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_thread_grant_repository_1.AgentThreadGrantRepository, telemetry_2.Telemetry])
], AgentToolApprovalService);
//# sourceMappingURL=agent-tool-approval.service.js.map