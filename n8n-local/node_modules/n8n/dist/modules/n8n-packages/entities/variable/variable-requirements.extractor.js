"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableRequirementsExtractor = void 0;
const di_1 = require("@n8n/di");
const VARS_REFERENCE_PATTERN = /\$vars\s*(?:\.\s*([A-Za-z_][A-Za-z0-9_]*)|\[\s*(?:'([^']+)'|"([^"]+)")\s*\])/g;
let VariableRequirementsExtractor = class VariableRequirementsExtractor {
    extract(workflow) {
        return this.extractNames(workflow).map((variableName) => ({
            workflowId: workflow.id,
            variableName,
        }));
    }
    extractNames(source) {
        const names = new Set();
        for (const node of source.nodes ?? []) {
            this.scan(node.parameters, names);
        }
        this.scan(source.settings, names);
        return [...names];
    }
    scan(value, names) {
        if (typeof value === 'string') {
            for (const match of value.matchAll(VARS_REFERENCE_PATTERN)) {
                const name = match[1] ?? match[2] ?? match[3];
                if (name)
                    names.add(name);
            }
            return;
        }
        if (Array.isArray(value)) {
            for (const item of value)
                this.scan(item, names);
            return;
        }
        if (value !== null && typeof value === 'object') {
            for (const nested of Object.values(value))
                this.scan(nested, names);
        }
    }
};
exports.VariableRequirementsExtractor = VariableRequirementsExtractor;
exports.VariableRequirementsExtractor = VariableRequirementsExtractor = __decorate([
    (0, di_1.Service)()
], VariableRequirementsExtractor);
//# sourceMappingURL=variable-requirements.extractor.js.map