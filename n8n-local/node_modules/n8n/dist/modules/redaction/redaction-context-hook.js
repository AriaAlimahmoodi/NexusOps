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
exports.RedactionContextHook = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const n8n_workflow_1 = require("n8n-workflow");
const instance_redaction_enforcement_service_1 = require("./instance-redaction-enforcement.service");
let RedactionContextHook = class RedactionContextHook {
    constructor(instanceRedactionEnforcementService, licenseState) {
        this.instanceRedactionEnforcementService = instanceRedactionEnforcementService;
        this.licenseState = licenseState;
        this.hookDescription = {
            name: 'RedactionContextHook',
        };
    }
    isApplicableToTriggerNode(_nodeType) {
        return false;
    }
    async execute(options) {
        if (!this.licenseState.isDataRedactionLicensed()) {
            return {
                contextUpdate: { redaction: { version: 2, production: false, manual: false } },
            };
        }
        const floor = await this.instanceRedactionEnforcementService.get();
        const workflow = (0, n8n_workflow_1.policyToChannels)(options.workflow.settings?.redactionPolicy ?? 'none');
        const inherited = (0, n8n_workflow_1.redactionSettingToChannels)(options.context?.redaction);
        const floorEnforcesProduction = floor !== 'off';
        const floorEnforcesManual = floor === 'all';
        const manual = workflow.manual || floorEnforcesManual || inherited.manual;
        const production = workflow.production || floorEnforcesProduction || manual || inherited.production;
        const floorRaisedTheBar = (floorEnforcesProduction && !workflow.production) ||
            (floorEnforcesManual && !workflow.manual);
        const source = floorRaisedTheBar ? 'instance' : 'workflow';
        return {
            contextUpdate: {
                redaction: {
                    version: 2,
                    production,
                    manual,
                    source,
                },
            },
        };
    }
};
exports.RedactionContextHook = RedactionContextHook;
exports.RedactionContextHook = RedactionContextHook = __decorate([
    (0, decorators_1.ContextEstablishmentHook)({
        alwaysExecute: true,
        runForSubExecution: true,
    }),
    __metadata("design:paramtypes", [instance_redaction_enforcement_service_1.InstanceRedactionEnforcementService, backend_common_1.LicenseState])
], RedactionContextHook);
//# sourceMappingURL=redaction-context-hook.js.map