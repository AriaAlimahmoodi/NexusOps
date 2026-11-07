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
exports.TeamsSetupTelemetryService = void 0;
exports.withTeamsFailure = withTeamsFailure;
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const n8n_workflow_1 = require("n8n-workflow");
const telemetry_2 = require("../../../../../telemetry");
const FAILURE_TAG = 'teamsSetupFailure';
function withTeamsFailure(error, reason) {
    Object.defineProperty(error, FAILURE_TAG, {
        value: reason,
        enumerable: false,
        writable: true,
        configurable: true,
    });
    return error;
}
let TeamsSetupTelemetryService = class TeamsSetupTelemetryService {
    constructor(telemetry) {
        this.telemetry = telemetry;
    }
    succeeded(report) {
        this.track(report, 'succeeded');
    }
    failed(report, error) {
        this.track(report, 'failed', reasonFor(error));
    }
    track(report, outcome, reason) {
        try {
            this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.AGENT_TEAMS_SETUP_STEP, {
                agent_id: report.agentId,
                project_id: report.projectId,
                user_id: report.userId,
                step: report.step,
                outcome,
                ...(report.botRoute ? { bot_route: report.botRoute } : {}),
                ...(report.installRoute ? { install_route: report.installRoute } : {}),
                ...(reason ? { reason } : {}),
            });
        }
        catch {
        }
    }
};
exports.TeamsSetupTelemetryService = TeamsSetupTelemetryService;
exports.TeamsSetupTelemetryService = TeamsSetupTelemetryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [telemetry_2.Telemetry])
], TeamsSetupTelemetryService);
function reasonFor(error) {
    if (!(error instanceof Error))
        return 'unknown';
    const tagged = error[FAILURE_TAG];
    if (typeof tagged === 'string')
        return tagged;
    return error instanceof n8n_workflow_1.UserError ? 'refused' : 'unknown';
}
//# sourceMappingURL=teams-setup-telemetry.service.js.map