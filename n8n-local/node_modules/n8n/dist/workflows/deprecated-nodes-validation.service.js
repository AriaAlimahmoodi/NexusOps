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
exports.DeprecatedNodesValidationService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_workflow_1 = require("n8n-workflow");
const deprecated_nodes_error_1 = require("../errors/response-errors/deprecated-nodes.error");
const node_types_1 = require("../node-types");
let DeprecatedNodesValidationService = class DeprecatedNodesValidationService {
    constructor(logger, nodesConfig, nodeTypes) {
        this.logger = logger;
        this.nodesConfig = nodesConfig;
        this.nodeTypes = nodeTypes;
    }
    validateOnCreate(nodes, workflowId) {
        if (!this.nodesConfig.blockDeprecated)
            return;
        const violations = [];
        for (const node of nodes) {
            if (this.deprecatedDescription(node)) {
                violations.push({ kind: 'added', nodeName: node.name, nodeType: node.type });
            }
        }
        this.throwIfViolations(violations, workflowId);
    }
    validateOnUpdate(incomingNodes, existingNodes, workflowId) {
        if (!this.nodesConfig.blockDeprecated)
            return;
        const existingById = new Map(existingNodes.map((n) => [n.id, n]));
        const violations = [];
        for (const incoming of incomingNodes) {
            const description = this.deprecatedDescription(incoming);
            if (!description)
                continue;
            const before = existingById.get(incoming.id);
            if (!before || !this.deprecatedDescription(before)) {
                violations.push({ kind: 'added', nodeName: incoming.name, nodeType: incoming.type });
                continue;
            }
            if (!(0, isEqual_1.default)(this.frozenFields(before, description), this.frozenFields(incoming, description))) {
                violations.push({ kind: 'edited', nodeName: incoming.name, nodeType: incoming.type });
            }
        }
        this.throwIfViolations(violations, workflowId);
    }
    frozenFields(node, description) {
        const { position: _position, notes, onError, continueOnFail, disabled, credentials, parameters, ...rest } = (0, n8n_workflow_1.normalizeNodeShape)(node);
        return {
            ...rest,
            parameters: n8n_workflow_1.NodeHelpers.getNodeParameters(description.properties, parameters, false, false, node, description) ?? {},
            credentials: credentials ?? {},
            disabled: disabled === true,
            continueOnFail: continueOnFail === true,
            onError: onError ?? 'stopWorkflow',
            notes: notes ?? '',
        };
    }
    throwIfViolations(violations, workflowId) {
        if (violations.length === 0)
            return;
        this.logger.warn('Rejected deprecated nodes', {
            workflowId,
            violations: violations.map(({ kind, nodeType }) => ({ kind, nodeType })),
        });
        throw new deprecated_nodes_error_1.DeprecatedNodesError(this.formatMessage(violations), { violations });
    }
    deprecatedDescription(node) {
        try {
            const { description } = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            return description.deprecated === true ? description : undefined;
        }
        catch {
            return undefined;
        }
    }
    formatMessage(violations) {
        const lines = violations.map((v) => {
            const verb = v.kind === 'added' ? 'use a' : 'modify a';
            return `Cannot ${verb} "${v.nodeType}" node ("${v.nodeName}"): this node type is deprecated.`;
        });
        const suffix = ' Replace the node with a supported alternative or remove it from the workflow.';
        return lines.join(' ') + suffix;
    }
};
exports.DeprecatedNodesValidationService = DeprecatedNodesValidationService;
exports.DeprecatedNodesValidationService = DeprecatedNodesValidationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.NodesConfig, node_types_1.NodeTypes])
], DeprecatedNodesValidationService);
//# sourceMappingURL=deprecated-nodes-validation.service.js.map