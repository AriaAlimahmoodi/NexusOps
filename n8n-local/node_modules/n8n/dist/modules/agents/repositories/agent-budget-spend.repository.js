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
exports.AgentBudgetSpendRepository = void 0;
exports.previousTotalUsd = previousTotalUsd;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const agent_budget_applied_call_entity_1 = require("../entities/agent-budget-applied-call.entity");
const agent_budget_spend_entity_1 = require("../entities/agent-budget-spend.entity");
function previousTotalUsd(totalUsd, usd) {
    return Number((totalUsd - usd).toPrecision(12));
}
let AgentBudgetSpendRepository = class AgentBudgetSpendRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_budget_spend_entity_1.AgentBudgetSpend, dataSource.manager, transactionRunner);
    }
    async readTotal(key) {
        const totals = await this.readTotalsWith(this.managerFor({}), [key]);
        return totals.get(key) ?? 0;
    }
    async applySpend(callId, entries) {
        return await this.runInTransaction({}, async (manager) => {
            const inserted = await this.insertAppliedCall(manager, callId);
            if (inserted)
                await this.incrementKeys(manager, entries);
            const stored = await this.readTotalsWith(manager, entries.map((entry) => entry.key));
            const unapplied = new Map();
            for (const entry of entries) {
                unapplied.set(entry.key, (unapplied.get(entry.key) ?? 0) + entry.usd);
            }
            return entries.map((entry) => {
                const totalUsd = stored.get(entry.key);
                if (totalUsd === undefined) {
                    if (inserted)
                        throw new n8n_workflow_1.UnexpectedError('Budget spend row is missing after insert');
                    return { key: entry.key, totalUsd: 0, previousUsd: 0 };
                }
                if (!inserted)
                    return { key: entry.key, totalUsd, previousUsd: totalUsd };
                const left = unapplied.get(entry.key) ?? entry.usd;
                const stillLeft = previousTotalUsd(left, entry.usd);
                unapplied.set(entry.key, stillLeft);
                return {
                    key: entry.key,
                    totalUsd: previousTotalUsd(totalUsd, stillLeft),
                    previousUsd: previousTotalUsd(totalUsd, left),
                };
            });
        });
    }
    async insertAppliedCall(manager, callId) {
        const table = this.quote(manager, this.tableName(manager, agent_budget_applied_call_entity_1.AgentBudgetAppliedCall));
        const callIdColumn = this.quote(manager, 'callId');
        const createdAtColumn = this.quote(manager, 'createdAt');
        const now = (0, db_1.dbNowLiteral)(this.isPostgres(manager));
        const sql = `INSERT INTO ${table} (${callIdColumn}, ${createdAtColumn}) VALUES (:callId, ${now}) ` +
            `ON CONFLICT (${callIdColumn}) DO NOTHING`;
        const affected = await this.execute(manager, sql, { callId });
        return affected > 0;
    }
    async incrementKeys(manager, entries) {
        if (entries.length === 0)
            return;
        const table = this.quote(manager, this.tableName(manager, agent_budget_spend_entity_1.AgentBudgetSpend));
        const keyColumn = this.quote(manager, 'key');
        const totalColumn = this.quote(manager, 'totalUsd');
        const createdAtColumn = this.quote(manager, 'createdAt');
        const updatedAtColumn = this.quote(manager, 'updatedAt');
        const now = (0, db_1.dbNowLiteral)(this.isPostgres(manager));
        const byKey = new Map();
        for (const entry of entries)
            byKey.set(entry.key, (byKey.get(entry.key) ?? 0) + entry.usd);
        const rows = [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b));
        const values = rows.map((_, i) => `(:key${i}, :usd${i}, ${now}, ${now})`).join(', ');
        const sql = `INSERT INTO ${table} (${keyColumn}, ${totalColumn}, ${createdAtColumn}, ${updatedAtColumn}) ` +
            `VALUES ${values} ` +
            `ON CONFLICT (${keyColumn}) DO UPDATE SET ${totalColumn} = ` +
            `${table}.${totalColumn} + EXCLUDED.${totalColumn}, ${updatedAtColumn} = ${now}`;
        const parameters = {};
        rows.forEach(([key, usd], i) => {
            parameters[`key${i}`] = key;
            parameters[`usd${i}`] = usd;
        });
        await this.execute(manager, sql, parameters);
    }
    async readTotalsWith(manager, keys) {
        if (keys.length === 0)
            return new Map();
        const rows = await manager.findBy(agent_budget_spend_entity_1.AgentBudgetSpend, { key: (0, typeorm_1.In)(keys) });
        return new Map(rows.map((row) => [row.key, Number(row.totalUsd)]));
    }
    async execute(manager, sql, parameters) {
        const queryRunner = manager.queryRunner;
        if (!queryRunner) {
            throw new n8n_workflow_1.UnexpectedError('Budget spend write has no query runner');
        }
        const [query, queryParameters] = manager.connection.driver.escapeQueryWithParameters(sql, parameters, {});
        const result = await queryRunner.query(query, queryParameters, true);
        if (!(0, is_record_1.isRecord)(result)) {
            throw new n8n_workflow_1.UnexpectedError('Budget spend write returned an unexpected result');
        }
        return typeof result.affected === 'number' ? result.affected : 0;
    }
    tableName(manager, target) {
        return manager.connection.getMetadata(target).tableName;
    }
    quote(manager, identifier) {
        return manager.connection.driver.escape(identifier);
    }
    isPostgres(manager) {
        return manager.connection.options.type === 'postgres';
    }
};
exports.AgentBudgetSpendRepository = AgentBudgetSpendRepository;
exports.AgentBudgetSpendRepository = AgentBudgetSpendRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentBudgetSpendRepository);
//# sourceMappingURL=agent-budget-spend.repository.js.map