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
exports.WorkflowTemplatesService = exports.TEMPLATE_REQUEST_TIMEOUT_MS = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
exports.TEMPLATE_REQUEST_TIMEOUT_MS = 5000;
let WorkflowTemplatesService = class WorkflowTemplatesService {
    constructor(logger, globalConfig, outboundHttp) {
        this.logger = logger;
        this.globalConfig = globalConfig;
        this.http = outboundHttp.requests({
            useDefaultSsrfPolicy: 'unsafe',
            timeout: exports.TEMPLATE_REQUEST_TIMEOUT_MS,
        });
    }
    async getTemplate(templateId) {
        const { enabled, host } = this.globalConfig.templates;
        if (!enabled || !host) {
            return { available: false };
        }
        const url = `${host.replace(/\/?$/, '/')}templates/workflows/${encodeURIComponent(templateId)}`;
        try {
            const body = await this.http.request({
                url,
                method: 'GET',
                headers: { Accept: 'application/json' },
                json: true,
            });
            const workflow = (0, is_record_1.isRecord)(body) ? body.workflow : undefined;
            if (!(0, is_record_1.isRecord)(workflow)) {
                this.logger.warn('Workflow template response missing workflow payload', { templateId });
                return { available: false };
            }
            return { available: true, template: workflow };
        }
        catch (error) {
            this.logger.error('Error fetching workflow template', { error, templateId });
            throw error;
        }
    }
};
exports.WorkflowTemplatesService = WorkflowTemplatesService;
exports.WorkflowTemplatesService = WorkflowTemplatesService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, backend_network_1.OutboundHttp])
], WorkflowTemplatesService);
//# sourceMappingURL=workflow-templates.service.js.map