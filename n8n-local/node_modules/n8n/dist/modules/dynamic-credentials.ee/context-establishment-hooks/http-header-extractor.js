"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpHeaderExtractor = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const node_vm_1 = require("node:vm");
const zod_1 = require("zod");
const HttpHeaderExtractorOptionsSchema = zod_1.z.object({
    headerName: zod_1.z.string().default('authorization'),
    headerValue: zod_1.z.string().default('[Bb][Ee][Aa][Rr][Ee][Rr]\\s+(.+)'),
});
const MAX_HEADER_LENGTH = 8192;
const REGEX_TIMEOUT_MS = 100;
function isUnsafeRegexPattern(pattern) {
    const nestedQuantifier = /([+*?{]|\{\d+,?\d*\})\s*[)]\s*[+*?{]/;
    const overlappingAlt = /\([^)]*\|[^)]*\)[+*]/;
    return nestedQuantifier.test(pattern) || overlappingAlt.test(pattern);
}
function isHeaderObject(obj) {
    return obj !== null && obj !== undefined && typeof obj === 'object' && !Array.isArray(obj);
}
const regexContext = (0, node_vm_1.createContext)({
    RegExp,
    pattern: '',
    input: '',
    result: null,
});
const regexScript = new node_vm_1.Script('result = new RegExp(pattern).exec(input)');
function safeRegexExec(pattern, input, timeoutMs = REGEX_TIMEOUT_MS) {
    regexContext.pattern = pattern;
    regexContext.input = input;
    regexContext.result = null;
    try {
        regexScript.runInContext(regexContext, { timeout: timeoutMs });
        return regexContext.result;
    }
    catch (error) {
        if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
            return null;
        }
        throw error;
    }
}
let HttpHeaderExtractor = class HttpHeaderExtractor {
    constructor(logger) {
        this.logger = logger;
        this.hookDescription = {
            name: 'HttpHeaderExtractor',
            displayName: 'HTTP Header Extractor',
            options: [
                {
                    name: 'headerName',
                    displayName: 'Header Name',
                    type: 'string',
                    default: 'authorization',
                    noDataExpression: true,
                    description: 'The name of the HTTP header to extract the value from.',
                },
                {
                    name: 'headerValue',
                    displayName: 'Header Value Pattern',
                    type: 'string',
                    noDataExpression: true,
                    default: '[Bb][Ee][Aa][Rr][Ee][Rr]\\s+(.+)',
                    description: 'A regular expression pattern to extract the identity from the header value. Use a capturing group to specify the identity part.',
                },
            ],
        };
    }
    isApplicableToTriggerNode(nodeType) {
        return nodeType === 'n8n-nodes-base.webhook' || nodeType === 'webhook';
    }
    async execute(options) {
        if (!options.triggerItems || options.triggerItems.length === 0) {
            this.logger.debug('No trigger items found, skipping HttpHeaderExtractor hook.');
            throw new Error('No trigger items found, to perform header extraction');
        }
        const httpHeaderOptions = await HttpHeaderExtractorOptionsSchema.safeParseAsync(options.options ?? {});
        if (httpHeaderOptions.error) {
            this.logger.error('Invalid options for HttpHeaderExtractor hook.', {
                error: httpHeaderOptions.error,
            });
            throw new Error('Invalid options for HttpHeaderExtractor hook');
        }
        const normalizedHeaderName = httpHeaderOptions.data.headerName.toLowerCase();
        const pattern = httpHeaderOptions.data.headerValue;
        if (isUnsafeRegexPattern(pattern)) {
            this.logger.warn('Potentially unsafe regex pattern rejected', { pattern });
            throw new Error('Detected unsafe regex pattern, rejecting processing');
        }
        const [triggerItem] = options.triggerItems;
        const headers = triggerItem.json['headers'];
        if (isHeaderObject(headers) && normalizedHeaderName in headers) {
            const headerValue = headers[normalizedHeaderName];
            if (typeof headerValue === 'string') {
                headers[normalizedHeaderName] = '**********';
                const truncatedValue = headerValue.slice(0, MAX_HEADER_LENGTH);
                try {
                    const match = safeRegexExec(pattern, truncatedValue);
                    if (match?.[1]) {
                        return {
                            triggerItems: options.triggerItems,
                            contextUpdate: {
                                credentials: {
                                    version: 1,
                                    identity: match[1],
                                    metadata: { source: 'http-header', headerName: normalizedHeaderName },
                                },
                            },
                        };
                    }
                    else {
                        return {
                            triggerItems: options.triggerItems,
                        };
                    }
                }
                catch (error) {
                    this.logger.error('Invalid regex pattern', { pattern, error });
                    throw new Error('Failed to execute regex pattern, during header extraction');
                }
            }
        }
        throw new Error('Http header not found or invalid');
    }
};
exports.HttpHeaderExtractor = HttpHeaderExtractor;
exports.HttpHeaderExtractor = HttpHeaderExtractor = __decorate([
    (0, decorators_1.ContextEstablishmentHook)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], HttpHeaderExtractor);
//# sourceMappingURL=http-header-extractor.js.map