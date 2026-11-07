"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAgentIdForeignKeys1765886667897 = void 0;
const table = {
    agents: 'chat_hub_agents',
    sessions: 'chat_hub_sessions',
    messages: 'chat_hub_messages',
};
class AddAgentIdForeignKeys1765886667897 {
    async up({ schemaBuilder: { addForeignKey }, runQuery, escape }) {
        const escapedAgentIdColumn = escape.columnName('agentId');
        await runQuery(`UPDATE ${escape.tableName(table.sessions)} SET ${escapedAgentIdColumn} = NULL WHERE ${escapedAgentIdColumn} IS NOT NULL AND ${escapedAgentIdColumn} NOT IN (SELECT id FROM ${escape.tableName(table.agents)})`);
        await runQuery(`UPDATE ${escape.tableName(table.messages)} SET ${escapedAgentIdColumn} = NULL WHERE ${escapedAgentIdColumn} IS NOT NULL AND ${escapedAgentIdColumn} NOT IN (SELECT id FROM ${escape.tableName(table.agents)})`);
        await addForeignKey(table.sessions, 'agentId', [table.agents, 'id'], 'FK_chat_hub_sessions_agentId', 'SET NULL');
        await addForeignKey(table.messages, 'agentId', [table.agents, 'id'], 'FK_chat_hub_messages_agentId', 'SET NULL');
    }
    async down({ schemaBuilder: { dropForeignKey } }) {
        await dropForeignKey(table.messages, 'agentId', [table.agents, 'id'], 'FK_chat_hub_messages_agentId');
        await dropForeignKey(table.sessions, 'agentId', [table.agents, 'id'], 'FK_chat_hub_sessions_agentId');
    }
}
exports.AddAgentIdForeignKeys1765886667897 = AddAgentIdForeignKeys1765886667897;
//# sourceMappingURL=1765886667897-AddAgentIdForeignKeys.js.map