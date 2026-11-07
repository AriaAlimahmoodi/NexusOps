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
exports.AgentSpendLedger = void 0;
exports.withBudgetGuardrail = withBudgetGuardrail;
const agents_1 = require("@n8n/agents");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const agent_budget_alert_service_1 = require("./agent-budget-alert.service");
const agent_budget_spend_repository_1 = require("./repositories/agent-budget-spend.repository");
const PENDING_CALLS_CAP = 10_000;
let AgentSpendLedger = class AgentSpendLedger {
    constructor(budgetSpendRepository, logger) {
        this.budgetSpendRepository = budgetSpendRepository;
        this.logger = logger;
        this.pending = new Map();
    }
    async add(callId, entries) {
        await this.flushPending();
        try {
            return await this.budgetSpendRepository.applySpend(callId, entries);
        }
        catch (error) {
            this.logger.warn('Failed to record budget spend; buffered the call for a later retry', {
                callId,
                error: error instanceof Error ? error.message : String(error),
            });
            this.buffer(callId, entries);
            return this.bufferedTotals(entries);
        }
    }
    async read(key) {
        await this.flushPending();
        try {
            const stored = await this.budgetSpendRepository.readTotal(key);
            return stored + this.bufferedTotalFor(key);
        }
        catch (error) {
            this.logger.warn('Failed to read budget spend; using the buffered totals', {
                key,
                error: error instanceof Error ? error.message : String(error),
            });
            return this.bufferedTotalFor(key);
        }
    }
    async flushPending() {
        for (const [callId, entries] of this.pending) {
            try {
                await this.budgetSpendRepository.applySpend(callId, entries);
            }
            catch {
                return;
            }
            this.pending.delete(callId);
        }
    }
    buffer(callId, entries) {
        if (this.pending.size >= PENDING_CALLS_CAP && !this.pending.has(callId)) {
            const oldest = this.pending.keys().next().value;
            if (oldest !== undefined) {
                this.pending.delete(oldest);
                this.logger.warn('Budget spend buffer is full; dropped the oldest buffered call', {
                    callId: oldest,
                });
            }
        }
        this.pending.set(callId, entries);
    }
    bufferedTotals(entries) {
        return entries.map((entry) => {
            const totalUsd = this.bufferedTotalFor(entry.key);
            return { key: entry.key, totalUsd, previousUsd: (0, agent_budget_spend_repository_1.previousTotalUsd)(totalUsd, entry.usd) };
        });
    }
    bufferedTotalFor(key) {
        let totalUsd = 0;
        for (const entries of this.pending.values()) {
            for (const entry of entries) {
                if (entry.key === key)
                    totalUsd += entry.usd;
            }
        }
        return totalUsd;
    }
};
exports.AgentSpendLedger = AgentSpendLedger;
exports.AgentSpendLedger = AgentSpendLedger = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_budget_spend_repository_1.AgentBudgetSpendRepository, backend_common_1.Logger])
], AgentSpendLedger);
function positiveUsd(value) {
    if (value === undefined || !Number.isFinite(value) || value <= 0)
        return undefined;
    return value;
}
function resolveBudgetLimits(input) {
    if (input.useRootSessionCap) {
        const childOn = input.budget?.enabled === true;
        const sessionCostCapUsd = positiveUsd(input.rootSessionCapUsd);
        const monthlyBudgetUsd = childOn ? positiveUsd(input.budget?.monthlyBudgetUsd) : undefined;
        if (sessionCostCapUsd === undefined && monthlyBudgetUsd === undefined)
            return undefined;
        return {
            sessionId: input.sessionId,
            agentId: input.agentId,
            sessionCostCapUsd,
            monthlyBudgetUsd,
            alertThresholdPercent: monthlyBudgetUsd !== undefined && childOn ? input.budget?.alertThresholdPercent : undefined,
        };
    }
    if (input.budget?.enabled !== true)
        return undefined;
    const sessionCostCapUsd = positiveUsd(input.budget.sessionCostCapUsd);
    const monthlyBudgetUsd = positiveUsd(input.budget.monthlyBudgetUsd);
    if (sessionCostCapUsd === undefined && monthlyBudgetUsd === undefined)
        return undefined;
    return {
        sessionId: input.sessionId,
        agentId: input.agentId,
        sessionCostCapUsd,
        monthlyBudgetUsd,
        alertThresholdPercent: monthlyBudgetUsd !== undefined ? input.budget.alertThresholdPercent : undefined,
    };
}
function monthlyAlertNotice(input, alertThresholdPercent) {
    const previewNotice = input.onNotice;
    const emailAgentId = alertEmailAgentId(input);
    if (alertThresholdPercent === undefined || emailAgentId === undefined)
        return previewNotice;
    const alertService = resolveAlertService();
    if (!alertService)
        return previewNotice;
    return (notice) => {
        previewNotice?.(notice);
        alertService.notifyMonthlyThreshold({
            agentId: emailAgentId,
            alertThresholdPercent,
        });
    };
}
function alertEmailAgentId(input) {
    if (hasId(input.alertAgentId))
        return input.alertAgentId;
    if (!hasId(input.agentId) || input.agentId.startsWith('inline:'))
        return undefined;
    return input.agentId;
}
function resolveAlertService() {
    try {
        return di_1.Container.get(agent_budget_alert_service_1.AgentBudgetAlertService);
    }
    catch {
        try {
            di_1.Container.get(backend_common_1.Logger).debug('Agent budget alert emails are unavailable: the service is not registered');
        }
        catch {
        }
        return undefined;
    }
}
function hasId(value) {
    return value !== undefined && value.length > 0;
}
function toGuardrailNoticeSink(input) {
    if (!input.onNotice)
        return undefined;
    return (notice) => {
        if (!(0, api_types_1.isAgentBudgetNoticeCode)(notice.code))
            return;
        input.onNotice?.({
            code: notice.code,
            ...(notice.agentId !== undefined ? { agentId: notice.agentId } : {}),
        });
    };
}
function attachGuardrails(options, hooks, onNotice) {
    const existing = options.guardrails;
    const notice = onNotice ?? existing?.onNotice;
    return {
        ...options,
        guardrails: {
            hooks: [...(existing?.hooks ?? []), ...hooks],
            ...(existing?.agentId !== undefined ? { agentId: existing.agentId } : {}),
            ...(existing?.threadId !== undefined ? { threadId: existing.threadId } : {}),
            ...(notice !== undefined ? { onNotice: notice } : {}),
        },
    };
}
function withBudgetGuardrail(options, input) {
    const limits = resolveBudgetLimits(input);
    const sink = toGuardrailNoticeSink(input);
    if (!limits)
        return sink ? attachGuardrails(options, [], sink) : options;
    const ledger = input.ledger ?? di_1.Container.get(AgentSpendLedger);
    const onNotice = monthlyAlertNotice(input, limits.alertThresholdPercent);
    const hook = (0, agents_1.createBudgetGuardrail)({
        ledger,
        ...limits,
        ...(onNotice ? { onNotice } : {}),
    });
    return attachGuardrails(options, [hook], sink);
}
//# sourceMappingURL=budget-guardrail.js.map