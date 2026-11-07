"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContentSecurityPolicyMiddleware = void 0;
const node_crypto_1 = require("node:crypto");
const content_security_policy_1 = require("../security/content-security-policy");
const ENFORCED_HEADER = 'Content-Security-Policy';
const REPORT_ONLY_HEADER = 'Content-Security-Policy-Report-Only';
const JAVASCRIPT_TYPES = new Set(['text/javascript', 'application/javascript']);
const essenceOf = (contentType) => contentType.split(';')[0].trim().toLowerCase();
const isJavaScriptResponse = (res) => {
    const contentType = res.getHeader('content-type');
    if (contentType === undefined)
        return false;
    const values = [contentType].flat().flatMap((value) => String(value).split(','));
    return values.length > 0 && values.every((value) => JAVASCRIPT_TYPES.has(essenceOf(value)));
};
const hasOwnPolicy = (res) => res.hasHeader(ENFORCED_HEADER);
const isHeaderValue = (value) => typeof value === 'string' ||
    typeof value === 'number' ||
    (Array.isArray(value) && value.every((entry) => typeof entry === 'string'));
const isHeaderEntry = (entry) => Array.isArray(entry);
const copyWriteHeadHeaders = (res, args) => {
    const headersIndex = typeof args[1] === 'string' ? 2 : 1;
    const headers = args[headersIndex];
    if (typeof headers !== 'object' || headers === null)
        return;
    if (!Array.isArray(headers)) {
        for (const [name, value] of Object.entries(headers)) {
            if (isHeaderValue(value))
                res.setHeader(name, value);
        }
        return;
    }
    const entries = [];
    const collect = (name, value) => {
        if (typeof name === 'string' && isHeaderValue(value))
            entries.push([name, value]);
    };
    if (headers.every(isHeaderEntry)) {
        for (const [name, value] of headers)
            collect(name, value);
    }
    else {
        for (let i = 0; i + 1 < headers.length; i += 2)
            collect(headers[i], headers[i + 1]);
    }
    const valuesByName = new Map();
    for (const [name, value] of entries) {
        const key = name.toLowerCase();
        const group = valuesByName.get(key) ?? { name, values: [] };
        valuesByName.set(key, group);
        group.values.push(...[value].flat().map(String));
    }
    for (const { name, values } of valuesByName.values()) {
        res.setHeader(name, values.length === 1 ? values[0] : values);
    }
    args[headersIndex] = {};
};
const createContentSecurityPolicyMiddleware = ({ enforced, reportOnly, }) => {
    return (_req, res, next) => {
        let nonce;
        const getNonce = () => (nonce ??= (0, node_crypto_1.randomBytes)(16).toString('base64url'));
        Object.defineProperty(res.locals, 'cspNonce', {
            get: getNonce,
            enumerable: true,
            configurable: true,
        });
        const writeHead = res.writeHead.bind(res);
        res.writeHead = ((...args) => {
            if (res.headersSent)
                return writeHead(...args);
            copyWriteHeadHeaders(res, args);
            const isNotModified = args[0] === 304;
            if (!isNotModified && !isJavaScriptResponse(res) && !hasOwnPolicy(res)) {
                if (enforced) {
                    res.setHeader(ENFORCED_HEADER, (0, content_security_policy_1.renderContentSecurityPolicy)(enforced, getNonce()));
                }
                if (reportOnly && !res.hasHeader(REPORT_ONLY_HEADER)) {
                    res.setHeader(REPORT_ONLY_HEADER, (0, content_security_policy_1.renderContentSecurityPolicy)(reportOnly, getNonce()));
                }
            }
            return writeHead(...args);
        });
        next();
    };
};
exports.createContentSecurityPolicyMiddleware = createContentSecurityPolicyMiddleware;
//# sourceMappingURL=content-security-policy.js.map