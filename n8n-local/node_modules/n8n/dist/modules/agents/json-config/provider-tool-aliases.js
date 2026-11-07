"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProviderToolName = resolveProviderToolName;
const ANTHROPIC_TOOL_ALIASES = {
    'anthropic.web_search': 'anthropic.web_search_20250305',
};
const OPENAI_TOOL_ALIASES = {};
const PROVIDER_TOOL_ALIASES = {
    ...ANTHROPIC_TOOL_ALIASES,
    ...OPENAI_TOOL_ALIASES,
};
function resolveProviderToolName(name) {
    return PROVIDER_TOOL_ALIASES[name] ?? name;
}
//# sourceMappingURL=provider-tool-aliases.js.map