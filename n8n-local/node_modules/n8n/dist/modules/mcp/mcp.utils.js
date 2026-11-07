"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMcpSupportedTriggerType = exports.findEnabledEligibleTrigger = exports.findEnabledEligibleTriggers = exports.getToolArguments = exports.getToolName = exports.getProtocolVersion = exports.getClientInfo = exports.isConnectionHandshake = void 0;
const is_record_1 = require("@n8n/utils/is-record");
const mcp_constants_1 = require("./mcp.constants");
const mcp_typeguards_1 = require("./mcp.typeguards");
const getRequestMetaValue = (params, key) => {
    const meta = params?._meta;
    return (0, is_record_1.isRecord)(meta) ? meta[key] : undefined;
};
const isConnectionHandshake = (body) => (0, mcp_typeguards_1.isJSONRPCRequest)(body) && (body.method === 'initialize' || body.method === mcp_constants_1.MCP_DISCOVER_METHOD);
exports.isConnectionHandshake = isConnectionHandshake;
const getClientInfo = (req) => {
    if (!(0, mcp_typeguards_1.isJSONRPCRequest)(req.body))
        return undefined;
    const params = req.body.params;
    const metaClientInfo = getRequestMetaValue(params, mcp_constants_1.MCP_CLIENT_INFO_META_KEY);
    if ((0, is_record_1.isRecord)(metaClientInfo)) {
        return {
            name: typeof metaClientInfo.name === 'string' ? metaClientInfo.name : undefined,
            version: typeof metaClientInfo.version === 'string' ? metaClientInfo.version : undefined,
        };
    }
    return params?.clientInfo;
};
exports.getClientInfo = getClientInfo;
const getProtocolVersion = (req) => {
    if (!(0, mcp_typeguards_1.isJSONRPCRequest)(req.body))
        return undefined;
    const version = getRequestMetaValue(req.body.params, mcp_constants_1.MCP_PROTOCOL_VERSION_META_KEY);
    return typeof version === 'string' ? version : undefined;
};
exports.getProtocolVersion = getProtocolVersion;
const getToolName = (body) => {
    if (!(0, mcp_typeguards_1.isJSONRPCRequest)(body))
        return 'unknown';
    if (!body.params)
        return 'unknown';
    const { name } = body.params;
    if (typeof name === 'string') {
        return name;
    }
    return 'unknown';
};
exports.getToolName = getToolName;
const getToolArguments = (body) => {
    if (!(0, mcp_typeguards_1.isJSONRPCRequest)(body))
        return {};
    if (!body.params)
        return {};
    const args = body.params.arguments;
    if ((0, is_record_1.isRecord)(args)) {
        return args;
    }
    return {};
};
exports.getToolArguments = getToolArguments;
const findEnabledEligibleTriggers = (nodes, isEligible) => nodes.filter((node) => !node.disabled && isEligible(node));
exports.findEnabledEligibleTriggers = findEnabledEligibleTriggers;
const findEnabledEligibleTrigger = (nodes, isEligible, triggerNodeName) => {
    const eligible = (0, exports.findEnabledEligibleTriggers)(nodes, isEligible);
    if (triggerNodeName) {
        return eligible.find((node) => node.name === triggerNodeName);
    }
    return eligible[0];
};
exports.findEnabledEligibleTrigger = findEnabledEligibleTrigger;
const isMcpSupportedTriggerType = (nodeType, mode = 'production') => {
    const triggerNodeTypes = mode === 'production'
        ? Object.keys(mcp_constants_1.SUPPORTED_PRODUCTION_MCP_TRIGGERS)
        : Object.keys(mcp_constants_1.SUPPORTED_MCP_TRIGGERS);
    return triggerNodeTypes.includes(nodeType);
};
exports.isMcpSupportedTriggerType = isMcpSupportedTriggerType;
//# sourceMappingURL=mcp.utils.js.map