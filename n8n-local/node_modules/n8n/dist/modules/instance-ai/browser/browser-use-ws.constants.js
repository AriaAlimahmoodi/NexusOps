"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTENSION_VERSION_QUERY_PARAM = exports.CDP_TOKEN_HEADER = exports.BROWSER_USE_WS_NAMESPACE = void 0;
exports.parseExtensionVersion = parseExtensionVersion;
exports.BROWSER_USE_WS_NAMESPACE = '/browser-use';
exports.CDP_TOKEN_HEADER = 'x-n8n-cdp-token';
exports.EXTENSION_VERSION_QUERY_PARAM = 'extensionVersion';
const EXTENSION_VERSION_PATTERN = /^\d{1,5}(\.\d{1,5}){0,3}$/;
function parseExtensionVersion(value) {
    if (typeof value !== 'string' || !EXTENSION_VERSION_PATTERN.test(value)) {
        return null;
    }
    return value;
}
//# sourceMappingURL=browser-use-ws.constants.js.map