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
exports.AgentBudgetSpend = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let AgentBudgetSpend = class AgentBudgetSpend extends db_1.WithTimestamps {
};
exports.AgentBudgetSpend = AgentBudgetSpend;
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 128,
        comment: 'Session key is the root thread id. Month key is {agentId}:{YYYY-MM}.',
    }),
    __metadata("design:type", String)
], AgentBudgetSpend.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'double precision',
        default: 0,
        comment: 'Running USD estimate for this ledger key. A check rejects a negative total.',
    }),
    __metadata("design:type", Number)
], AgentBudgetSpend.prototype, "totalUsd", void 0);
exports.AgentBudgetSpend = AgentBudgetSpend = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_budget_spend' })
], AgentBudgetSpend);
//# sourceMappingURL=agent-budget-spend.entity.js.map