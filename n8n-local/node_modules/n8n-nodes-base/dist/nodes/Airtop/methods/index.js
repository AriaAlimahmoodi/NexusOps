"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSearchAgents = listSearchAgents;
exports.agentsResourceMapping = agentsResourceMapping;
const agent_utils_1 = require("../actions/agent/agent.utils");
const constants_1 = require("../constants");
const transport_1 = require("../transport");
const VALID_FIELD_TYPES = [
    'boolean',
    'number',
    'string',
    'dateTime',
    'time',
    'array',
    'object',
    'options',
];
function isValidFieldType(value) {
    return VALID_FIELD_TYPES.includes(value);
}
/**
 * Searches for Airtop agents available in the user's account.
 * Used as the searchListMethod for the agent resourceLocator.
 */
async function listSearchAgents(filter) {
    const qs = {
        limit: 50,
        enabled: true,
        published: true,
        createdByMe: true,
        name: filter ?? '',
    };
    const response = await transport_1.apiRequest.call(this, 'GET', `${constants_1.BASE_URL_V2}/agents`, {}, qs);
    const agents = response.agents ?? [];
    const results = agents
        .map((agent) => ({
        name: agent.name,
        value: agent.id,
    }))
        .sort((a, b) => a.name.localeCompare(b.name));
    return { results };
}
/**
 * Maps the agent parameters to the resource mapper fields.
 * Used as the resourceMapperMethod for the agent parameters dropdown.
 */
async function agentsResourceMapping() {
    const agentId = this.getCurrentNodeParameter('agentId');
    if (!agentId?.value) {
        return { fields: [] };
    }
    const response = await agent_utils_1.getAgentDetails.call(this, agentId.value);
    if (!response?.versionData?.configVarsSchema?.properties) {
        return { fields: [] };
    }
    const properties = response.versionData.configVarsSchema.properties;
    const requiredFields = response.versionData.configVarsSchema?.required ?? [];
    const fields = Object.entries(properties)
        .map(([name, prop]) => {
        const isRequired = requiredFields.includes(name);
        const fieldType = isValidFieldType(prop.type) ? prop.type : 'string';
        return {
            id: name,
            displayName: `${name}${isRequired ? ' (required)' : ''}`,
            defaultMatch: false,
            display: true,
            type: fieldType,
            required: isRequired,
        };
    })
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
    return { fields };
}
//# sourceMappingURL=index.js.map