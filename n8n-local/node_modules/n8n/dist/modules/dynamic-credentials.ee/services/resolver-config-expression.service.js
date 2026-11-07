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
exports.ResolverConfigExpressionService = void 0;
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_types_1 = require("../../../node-types");
const workflow_execute_additional_data_1 = require("../../../workflow-execute-additional-data");
let ResolverConfigExpressionService = class ResolverConfigExpressionService {
    constructor(nodeTypes) {
        this.nodeTypes = nodeTypes;
    }
    async resolve(config, canUseExternalSecrets = false) {
        if (!(0, n8n_workflow_1.isNodeParameters)(config)) {
            return config;
        }
        const workflow = new n8n_workflow_1.Workflow({
            nodes: [],
            connections: {},
            active: false,
            nodeTypes: this.nodeTypes,
        });
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)();
        const additionalKeys = (0, n8n_core_1.getNonWorkflowAdditionalKeys)(additionalData, {
            secretsEnabled: canUseExternalSecrets,
        });
        await workflow.expression.acquireIsolate();
        try {
            return workflow.expression.getComplexParameterValue({
                id: '1',
                name: 'Mock Node',
            }, config, 'manual', additionalKeys, undefined, undefined, config);
        }
        finally {
            await workflow.expression.releaseIsolate();
        }
    }
};
exports.ResolverConfigExpressionService = ResolverConfigExpressionService;
exports.ResolverConfigExpressionService = ResolverConfigExpressionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [node_types_1.NodeTypes])
], ResolverConfigExpressionService);
//# sourceMappingURL=resolver-config-expression.service.js.map