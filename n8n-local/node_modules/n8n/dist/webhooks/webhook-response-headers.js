"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookResponseHeaders = void 0;
exports.setRouteSandboxSetting = setRouteSandboxSetting;
exports.applySandboxCSP = applySandboxCSP;
exports.applyFormSandboxCSP = applyFormSandboxCSP;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const node_http_1 = require("node:http");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const PROTECTED_HEADERS = new Set([
    'content-security-policy',
    'strict-transport-security',
    'clear-site-data',
]);
class WebhookResponseHeaders {
    constructor() {
        this.headers = new Map();
    }
    static fromObject(obj) {
        const instance = new WebhookResponseHeaders();
        instance.addFromObject(obj);
        return instance;
    }
    set(name, value) {
        const lowerName = name.toLowerCase();
        if (PROTECTED_HEADERS.has(lowerName)) {
            di_1.Container.get(backend_common_1.Logger).warn('Dropping protected webhook response header', {
                headerName: name,
            });
            return;
        }
        try {
            (0, node_http_1.validateHeaderName)(lowerName);
            (0, node_http_1.validateHeaderValue)(lowerName, value);
        }
        catch (e) {
            di_1.Container.get(backend_common_1.Logger).warn('Dropping invalid webhook response header', {
                headerName: name,
                error: (0, ensure_error_1.ensureError)(e).message,
            });
            return;
        }
        this.headers.set(lowerName, value);
    }
    addFromObject(obj) {
        for (const [name, value] of Object.entries(obj)) {
            this.set(name, String(value));
        }
    }
    addFromNodeHeaders(nodeHeaders) {
        if (nodeHeaders.entries === undefined)
            return;
        for (const entry of nodeHeaders.entries) {
            this.set(entry.name, entry.value);
        }
    }
    applyToResponse(res) {
        if (this.headers.size === 0)
            return;
        res.setHeaders(this.headers);
    }
}
exports.WebhookResponseHeaders = WebhookResponseHeaders;
const SANDBOX_SETTING_LOCAL = 'webhookSandboxSetting';
function setRouteSandboxSetting(res, setting) {
    res.locals[SANDBOX_SETTING_LOCAL] = setting;
}
function getRouteSandboxSetting(res) {
    const setting = res.locals?.[SANDBOX_SETTING_LOCAL];
    return setting === 'webhook' || setting === 'form' ? setting : undefined;
}
function applySandboxCSP(res, fallback = 'webhook') {
    const setting = getRouteSandboxSetting(res) ?? fallback;
    const disabled = setting === 'form' ? (0, n8n_core_1.isFormHtmlSandboxingDisabled)() : (0, n8n_core_1.isWebhookHtmlSandboxingDisabled)();
    if (disabled)
        return;
    res.setHeader('Content-Security-Policy', (0, n8n_core_1.getHtmlSandboxCSP)());
}
function applyFormSandboxCSP(res) {
    if ((0, n8n_core_1.isFormHtmlSandboxingDisabled)()) {
        res.removeHeader('Content-Security-Policy');
        return;
    }
    res.setHeader('Content-Security-Policy', (0, n8n_core_1.getHtmlSandboxCSP)());
}
//# sourceMappingURL=webhook-response-headers.js.map