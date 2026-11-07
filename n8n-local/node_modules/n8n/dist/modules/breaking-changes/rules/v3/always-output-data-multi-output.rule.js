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
exports.AlwaysOutputDataMultiOutputRule = void 0;
const decorators_1 = require("@n8n/decorators");
const n8n_workflow_1 = require("n8n-workflow");
const node_types_1 = require("../../../../node-types");
const detection_report_1 = require("../../detection-report");
let AlwaysOutputDataMultiOutputRule = class AlwaysOutputDataMultiOutputRule {
    constructor(nodeTypes) {
        this.nodeTypes = nodeTypes;
        this.id = 'always-output-data-multi-output-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: '"Always Output Data" behavior fix on nodes with multiple outputs',
            description: 'On nodes with multiple outputs, "Always Output Data" currently adds an empty item to the first output even when another output produced data, which misroutes items. A future version fixes this so the empty item is only added when every output is empty. Workflows relying on the current behavior will produce different output.',
            category: "workflow",
            impact: 'behaviorChanges',
        };
    }
    async getRecommendations(_workflowResults) {
        return [
            {
                action: 'Review nodes using "Always Output Data" with multiple outputs',
                description: 'After the fix, these nodes will no longer add an empty item to the first output when another output has data. Update any downstream logic that relies on that empty first-output item (for example a branch off the first output that runs on the empty case).',
            },
        ];
    }
    async detectWorkflow(_workflow, nodesGroupedByType) {
        const affectedNodes = [];
        for (const nodes of nodesGroupedByType.values()) {
            for (const node of nodes) {
                if (node.alwaysOutputData === true && this.hasMultipleMainOutputs(node)) {
                    affectedNodes.push(node);
                }
            }
        }
        return (0, detection_report_1.reportAffectedNodes)(affectedNodes, (node) => ({
            title: `Node '${node.name}' uses "Always Output Data" and has multiple outputs`,
            description: '"Always Output Data" currently adds an empty item to this node\'s first output even when another output has data. A future version fixes this to only add the empty item when every output is empty, so this node\'s output will change. Review any logic downstream of its first output.',
            level: 'warning',
        }));
    }
    hasMultipleMainOutputs(node) {
        if (node.onError === 'continueErrorOutput')
            return true;
        let outputs;
        try {
            outputs = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion).description.outputs;
        }
        catch {
            return false;
        }
        if (!Array.isArray(outputs))
            return true;
        const mainOutputCount = outputs.filter((output) => (typeof output === 'string' ? output : output.type) === n8n_workflow_1.NodeConnectionTypes.Main).length;
        return mainOutputCount > 1;
    }
};
exports.AlwaysOutputDataMultiOutputRule = AlwaysOutputDataMultiOutputRule;
exports.AlwaysOutputDataMultiOutputRule = AlwaysOutputDataMultiOutputRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [node_types_1.NodeTypes])
], AlwaysOutputDataMultiOutputRule);
//# sourceMappingURL=always-output-data-multi-output.rule.js.map