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
exports.NodeDefinedFieldRedactionStrategy = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const node_types_1 = require("../../../../node-types");
function isSensitiveFieldsResult(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'sensitiveFields' in value &&
        'unknownNodes' in value &&
        value.sensitiveFields instanceof Map &&
        value.unknownNodes instanceof Set);
}
let NodeDefinedFieldRedactionStrategy = class NodeDefinedFieldRedactionStrategy {
    constructor(logger, nodeTypes) {
        this.logger = logger;
        this.nodeTypes = nodeTypes;
        this.name = 'node-defined-field-redaction';
    }
    requiresRedaction(execution, context) {
        if (!execution.data.resultData.runData)
            return false;
        const { sensitiveFields, unknownNodes } = this.getSensitiveFieldsMap(execution, context);
        return sensitiveFields.size > 0 || unknownNodes.size > 0;
    }
    async apply(execution, context) {
        const { sensitiveFields, unknownNodes } = this.getSensitiveFieldsMap(execution, context);
        if (sensitiveFields.size === 0 && unknownNodes.size === 0)
            return;
        const runData = execution.data.resultData.runData;
        if (!runData)
            return;
        for (const nodeName of Object.keys(runData)) {
            if (unknownNodes.has(nodeName)) {
                for (const taskData of runData[nodeName]) {
                    if (taskData.data) {
                        this.redactAllOutputs(taskData.data);
                    }
                }
                continue;
            }
            const fieldPaths = sensitiveFields.get(nodeName);
            if (!fieldPaths?.length)
                continue;
            for (const taskData of runData[nodeName]) {
                if (!taskData.data)
                    continue;
                this.redactTaskDataOutputs(taskData.data, fieldPaths);
            }
        }
    }
    redactTaskDataOutputs(connections, fieldPaths) {
        for (const outputs of Object.values(connections)) {
            for (const items of outputs) {
                if (!items)
                    continue;
                for (const item of items) {
                    this.redactFields(item, fieldPaths);
                }
            }
        }
    }
    getSensitiveFieldsMap(execution, context) {
        const cached = context.memo.get(this.name);
        if (isSensitiveFieldsResult(cached))
            return cached;
        const result = this.buildSensitiveFieldsMap(execution);
        context.memo.set(this.name, result);
        return result;
    }
    buildSensitiveFieldsMap(execution) {
        const sensitiveFields = new Map();
        const unknownNodes = new Set();
        for (const node of execution.workflowData.nodes) {
            let description;
            try {
                description = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion).description;
            }
            catch {
                this.logger.warn(`[NodeDefinedFieldRedactionStrategy] Could not load type for node "${node.name}" (${node.type} v${node.typeVersion}) — redacting all outputs conservatively`);
                unknownNodes.add(node.name);
                continue;
            }
            if (description.sensitiveOutputFields?.length) {
                sensitiveFields.set(node.name, description.sensitiveOutputFields);
            }
        }
        return { sensitiveFields, unknownNodes };
    }
    redactAllOutputs(connections) {
        for (const outputs of Object.values(connections)) {
            for (const items of outputs) {
                if (items) {
                    for (const item of items) {
                        item.json = {};
                        delete item.binary;
                        item.redaction = { redacted: true, reason: 'node_type_unavailable' };
                    }
                }
            }
        }
    }
    redactFields(item, fieldPaths) {
        for (const path of fieldPaths) {
            this.redactPath(item.json, path);
        }
    }
    isRecord(value) {
        return typeof value === 'object' && value !== null;
    }
    redactPath(obj, path) {
        const segments = path.split('.');
        this.redactPathRecursive(obj, segments, 0);
    }
    redactPathRecursive(current, segments, index) {
        if (index === segments.length - 1) {
            const lastSegment = segments[index];
            if (!(lastSegment in current))
                return;
            const marker = {
                __redacted: true,
                reason: 'node_defined_field',
                canReveal: false,
            };
            current[lastSegment] = marker;
            return;
        }
        const segment = segments[index];
        if (segment.endsWith('[*]')) {
            const key = segment.slice(0, -3);
            const arr = current[key];
            if (!Array.isArray(arr))
                return;
            for (const element of arr) {
                if (this.isRecord(element)) {
                    this.redactPathRecursive(element, segments, index + 1);
                }
            }
            return;
        }
        const next = current[segment];
        if (!this.isRecord(next))
            return;
        this.redactPathRecursive(next, segments, index + 1);
    }
};
exports.NodeDefinedFieldRedactionStrategy = NodeDefinedFieldRedactionStrategy;
exports.NodeDefinedFieldRedactionStrategy = NodeDefinedFieldRedactionStrategy = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, node_types_1.NodeTypes])
], NodeDefinedFieldRedactionStrategy);
//# sourceMappingURL=node-defined-field-redaction.strategy.js.map