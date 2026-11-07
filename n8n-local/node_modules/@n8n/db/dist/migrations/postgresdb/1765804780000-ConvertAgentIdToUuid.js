"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertAgentIdToUuid1765804780000 = void 0;
const table = {
    sessions: 'chat_hub_sessions',
    messages: 'chat_hub_messages',
};
class ConvertAgentIdToUuid1765804780000 {
    async up({ runQuery, escape }) {
        await runQuery(`ALTER TABLE ${escape.tableName(table.sessions)} ALTER COLUMN "agentId" TYPE uuid USING "agentId"::uuid`);
        await runQuery(`ALTER TABLE ${escape.tableName(table.messages)} ALTER COLUMN "agentId" TYPE uuid USING "agentId"::uuid`);
    }
    async down({ runQuery, escape }) {
        await runQuery(`ALTER TABLE ${escape.tableName(table.sessions)} ALTER COLUMN "agentId" TYPE varchar(36)`);
        await runQuery(`ALTER TABLE ${escape.tableName(table.messages)} ALTER COLUMN "agentId" TYPE varchar(36)`);
    }
}
exports.ConvertAgentIdToUuid1765804780000 = ConvertAgentIdToUuid1765804780000;
//# sourceMappingURL=1765804780000-ConvertAgentIdToUuid.js.map