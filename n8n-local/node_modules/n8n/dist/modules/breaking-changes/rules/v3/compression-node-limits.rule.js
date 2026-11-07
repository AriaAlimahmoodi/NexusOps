"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompressionNodeLimitsRule = void 0;
const decorators_1 = require("@n8n/decorators");
const detection_report_1 = require("../../detection-report");
let CompressionNodeLimitsRule = class CompressionNodeLimitsRule {
    constructor() {
        this.id = 'compression-node-limits-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'Compression node limits are lowered',
            description: 'The default maximum decompressed size is reduced from 2 GiB to 256 MiB and the default maximum number of ZIP entries from 5000 to 1000. Compression nodes handling archives beyond the new limits will fail.',
            category: "environment",
            impact: 'executionsFail',
        };
    }
    async detect() {
        const instanceIssues = [];
        if (process.env.N8N_COMPRESSION_NODE_MAX_DECOMPRESSED_SIZE_BYTES === undefined) {
            instanceIssues.push({
                title: 'Instance relies on the current default decompressed size limit',
                description: 'N8N_COMPRESSION_NODE_MAX_DECOMPRESSED_SIZE_BYTES is not set, so this instance uses the default of 2 GiB. After the update, decompressing more than 256 MiB will fail.',
                level: 'info',
            });
        }
        if (process.env.N8N_COMPRESSION_NODE_MAX_ZIP_ENTRIES === undefined) {
            instanceIssues.push({
                title: 'Instance relies on the current default ZIP entries limit',
                description: 'N8N_COMPRESSION_NODE_MAX_ZIP_ENTRIES is not set, so this instance uses the default of 5000 entries. After the update, ZIP archives with more than 1000 entries will fail to decompress.',
                level: 'info',
            });
        }
        if (instanceIssues.length === 0) {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        return {
            isAffected: true,
            instanceIssues,
            recommendations: [
                {
                    action: 'Set the compression limits explicitly',
                    description: 'If your workflows decompress large archives, set N8N_COMPRESSION_NODE_MAX_DECOMPRESSED_SIZE_BYTES and N8N_COMPRESSION_NODE_MAX_ZIP_ENTRIES to keep the current limits.',
                },
            ],
        };
    }
};
exports.CompressionNodeLimitsRule = CompressionNodeLimitsRule;
exports.CompressionNodeLimitsRule = CompressionNodeLimitsRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
], CompressionNodeLimitsRule);
//# sourceMappingURL=compression-node-limits.rule.js.map