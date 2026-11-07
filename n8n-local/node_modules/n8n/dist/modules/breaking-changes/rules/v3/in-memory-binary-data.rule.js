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
exports.InMemoryBinaryDataRule = void 0;
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
const detection_report_1 = require("../../detection-report");
let InMemoryBinaryDataRule = class InMemoryBinaryDataRule {
    constructor(binaryDataConfig) {
        this.binaryDataConfig = binaryDataConfig;
        this.id = 'in-memory-binary-data-v3';
    }
    getMetadata() {
        return {
            version: 'v3',
            title: 'In-memory binary data storage is removed',
            description: 'The in-memory binary data storage mode (`default`) is removed. Instances using it must switch to `filesystem`, `s3`, or `database`.',
            category: "infrastructure",
            impact: 'behaviorChanges',
        };
    }
    async detect() {
        if (this.binaryDataConfig.mode !== 'default') {
            return detection_report_1.NOT_AFFECTED_INSTANCE;
        }
        return {
            isAffected: true,
            instanceIssues: [
                {
                    title: 'Binary data is stored in memory',
                    description: 'This instance stores binary data in memory (`default` mode), which is removed in the new version.',
                    level: 'warning',
                },
            ],
            recommendations: [
                {
                    action: 'Switch the binary data mode',
                    description: 'Set N8N_DEFAULT_BINARY_DATA_MODE to `filesystem`, `s3`, or `database` before updating, and ensure the chosen storage has adequate capacity.',
                },
            ],
        };
    }
};
exports.InMemoryBinaryDataRule = InMemoryBinaryDataRule;
exports.InMemoryBinaryDataRule = InMemoryBinaryDataRule = __decorate([
    (0, decorators_1.BreakingChangeRule)({ version: 'v3' }),
    __metadata("design:paramtypes", [n8n_core_1.BinaryDataConfig])
], InMemoryBinaryDataRule);
//# sourceMappingURL=in-memory-binary-data.rule.js.map