"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedactionService = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("../../utils");
let RedactionService = class RedactionService {
    redact(data, properties) {
        const copiedData = (0, n8n_workflow_1.deepCopy)(data || {});
        const fieldsToRedact = properties
            .filter((prop) => prop.typeOptions?.password)
            .map((prop) => prop.name);
        for (const fieldName of fieldsToRedact) {
            if (fieldName in copiedData && this.shouldRedactValue(copiedData[fieldName])) {
                copiedData[fieldName] = n8n_workflow_1.CREDENTIAL_BLANKING_VALUE;
            }
        }
        if ('oauthTokenData' in copiedData) {
            copiedData.oauthTokenData = n8n_workflow_1.CREDENTIAL_BLANKING_VALUE;
        }
        return copiedData;
    }
    unredact(redactedData, savedData) {
        const mergedData = (0, n8n_workflow_1.deepCopy)(redactedData ?? {});
        this.unredactRestoreValues(mergedData, savedData);
        return mergedData;
    }
    shouldRedactValue(value) {
        return typeof value === 'string' && !(0, utils_1.containsExpression)(value);
    }
    unredactRestoreValues(unmerged, replacement) {
        for (const [key, value] of Object.entries(unmerged)) {
            if (value === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE) {
                unmerged[key] = replacement[key];
            }
            else if (typeof value === 'object' &&
                value !== null &&
                key in replacement &&
                typeof replacement[key] === 'object' &&
                replacement[key] !== null) {
                this.unredactRestoreValues(value, replacement[key]);
            }
        }
    }
};
exports.RedactionService = RedactionService;
exports.RedactionService = RedactionService = __decorate([
    (0, di_1.Service)()
], RedactionService);
//# sourceMappingURL=redaction.service.ee.js.map