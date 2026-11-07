"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enabledToolCategories = enabledToolCategories;
exports.resolveComputerUseState = resolveComputerUseState;
const instance_ai_gateway_service_1 = require("./instance-ai-gateway.service");
function enabledToolCategories(declared) {
    return declared.filter(({ enabled }) => enabled).map(({ name }) => name);
}
function resolveLocalComputer({ reportedByClient, localGatewayDisabledGlobally, localGatewayDisabledForUser, localComputerToolCategories, }) {
    if (localComputerToolCategories) {
        return { status: 'connected', toolCategories: localComputerToolCategories };
    }
    if (localGatewayDisabledGlobally || !reportedByClient)
        return { status: 'unavailable' };
    if (localGatewayDisabledForUser)
        return { status: 'disabledByUser' };
    return { status: 'disconnected' };
}
function resolveBrowser({ reportedByClient, browserUseEnabledGlobally, browserConnected, }) {
    if (browserConnected) {
        return { status: 'connected', toolCategories: [instance_ai_gateway_service_1.BROWSER_TOOL_CATEGORY] };
    }
    if (!browserUseEnabledGlobally || !reportedByClient)
        return { status: 'unavailable' };
    return { status: 'disconnected' };
}
function resolveComputerUseState({ clientChannels, localGatewayDisabledGlobally, localGatewayDisabledForUser, browserUseEnabledGlobally, localComputerToolCategories, browserConnected, }) {
    return {
        localComputer: resolveLocalComputer({
            reportedByClient: clientChannels?.includes('localComputer') ?? false,
            localGatewayDisabledGlobally,
            localGatewayDisabledForUser,
            localComputerToolCategories,
        }),
        browser: resolveBrowser({
            reportedByClient: clientChannels?.includes('browser') ?? false,
            browserUseEnabledGlobally,
            browserConnected,
        }),
    };
}
//# sourceMappingURL=computer-use-availability.js.map