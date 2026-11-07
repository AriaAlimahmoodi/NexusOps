"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConfigureChannelTool = buildConfigureChannelTool;
const tool_1 = require("@n8n/agents/tool");
const api_types_1 = require("@n8n/api-types");
const telemetry_1 = require("@n8n/telemetry");
const nanoid_1 = require("nanoid");
const zod_1 = require("zod");
const configureChannelInputSchema = zod_1.z.object({
    integrationType: zod_1.z.string().describe('Chat platform type from agent-context integrations'),
});
function buildConfigureChannelTool(deps) {
    return new tool_1.Tool(api_types_1.CONFIGURE_CHANNEL_TOOL_NAME)
        .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(api_types_1.CONFIGURE_CHANNEL_TOOL_NAME))
        .description('Configure one available chat channel for the target agent. First call ' +
        'agent-context with type "integrations" and pass a returned `type` as `integrationType`; do not infer ' +
        'channel names. Shows setup UI in chat where the user creates a new channel credential ' +
        '(for n8n_chat: confirms the agent description) or skips. The setup UI persists the channel configuration and does not publish the agent, ' +
        'so use this for channel credentials instead of the credentials tool or config writes. ' +
        'Returns { configured: boolean } (plus configMutated/agentId refresh metadata when configured); ' +
        'false means the user skipped, so continue without the channel and do not re-prompt.')
        .input(configureChannelInputSchema)
        .suspend(api_types_1.channelSuspendPayloadSchema)
        .resume(api_types_1.channelResumeSchema)
        .handler(async ({ integrationType }, ctx) => {
        if (ctx.resumeData !== undefined && ctx.resumeData !== null) {
            if (ctx.resumeData.approved) {
                deps.track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_ADDED_TRIGGER, {
                    trigger_type: integrationType,
                });
            }
            return { configured: ctx.resumeData.approved };
        }
        const availableTypes = await deps.listChatIntegrationTypes();
        if (!availableTypes.includes(integrationType)) {
            const availableMessage = availableTypes.length
                ? ` Available: ${availableTypes.join(', ')}.`
                : ' No chat channels are currently available.';
            return {
                ok: false,
                errors: [
                    {
                        message: `Unsupported chat channel "${integrationType}". Call agent-context with type "integrations" ` +
                            'and choose a returned type.' +
                            availableMessage,
                    },
                ],
            };
        }
        return await ctx.suspend({
            requestId: (0, nanoid_1.nanoid)(),
            message: `Set up the ${integrationType} channel`,
            severity: 'info',
            channelConfig: { integrationType, agentId: deps.agentId },
            projectId: deps.projectId,
        });
    })
        .build();
}
//# sourceMappingURL=configure-channel.tool.js.map