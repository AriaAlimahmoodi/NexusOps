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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAuditService = void 0;
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const config_2 = __importDefault(require("../config"));
const constants_1 = require("../security-audit/constants");
const utils_1 = require("../security-audit/utils");
let SecurityAuditService = class SecurityAuditService {
    constructor(workflowRepository, securityConfig) {
        this.workflowRepository = workflowRepository;
        this.securityConfig = securityConfig;
        this.reporters = {};
    }
    async run(categories = constants_1.RISK_CATEGORIES, daysAbandonedWorkflow) {
        if (categories.length === 0)
            categories = constants_1.RISK_CATEGORIES;
        await this.initReporters(categories);
        const daysFromEnv = this.securityConfig.daysAbandonedWorkflow;
        if (daysAbandonedWorkflow) {
            config_2.default.set('security.audit.daysAbandonedWorkflow', daysAbandonedWorkflow);
        }
        const workflows = await this.workflowRepository.find({
            select: ['id', 'name', 'active', 'activeVersionId', 'nodes', 'connections'],
        });
        const promises = categories.map(async (c) => await this.reporters[c].report(workflows));
        const reports = (await Promise.all(promises)).filter((r) => r !== null);
        if (daysAbandonedWorkflow) {
            config_2.default.set('security.audit.daysAbandonedWorkflow', daysFromEnv);
        }
        if (reports.length === 0)
            return [];
        return reports.reduce((acc, cur) => {
            acc[(0, utils_1.toReportTitle)(cur.risk)] = cur;
            return acc;
        }, {});
    }
    async initReporters(categories) {
        for (const category of categories) {
            const className = category.charAt(0).toUpperCase() + category.slice(1) + 'RiskReporter';
            const toFilename = {
                CredentialsRiskReporter: 'credentials-risk-reporter',
                DatabaseRiskReporter: 'database-risk-reporter',
                FilesystemRiskReporter: 'filesystem-risk-reporter',
                InstanceRiskReporter: 'instance-risk-reporter',
                NodesRiskReporter: 'nodes-risk-reporter',
            };
            const RiskReporterModule = await import(`./risk-reporters/${toFilename[className]}.js`);
            const RiskReporterClass = RiskReporterModule[className];
            this.reporters[category] = di_1.Container.get(RiskReporterClass);
        }
    }
};
exports.SecurityAuditService = SecurityAuditService;
exports.SecurityAuditService = SecurityAuditService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowRepository, config_1.SecurityConfig])
], SecurityAuditService);
//# sourceMappingURL=security-audit.service.js.map