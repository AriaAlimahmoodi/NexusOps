"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelIntegrationRecorder = exports.ChannelIntegrationRecorder = void 0;
const sensitive_headers_1 = require("@n8n/utils/redaction/sensitive-headers");
const promises_1 = require("fs/promises");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = require("path");
const SENSITIVE_HEADERS = new Set([
    ...sensitive_headers_1.ALWAYS_SENSITIVE_HEADERS,
    'x-slack-signature',
    'x-telegram-bot-api-secret-token',
]);
const DEFAULT_FETCH_URL_PATTERNS = [
    /\.slack\.com/i,
    /api\.telegram\.org/i,
    /api\.linear\.app/i,
    /linear\.app/i,
];
const SANITIZED_N8N_HOST = 'https://n8n.host.com';
function sanitizeHeaderValue(key, value) {
    const normalizedKey = key.toLowerCase();
    if (!SENSITIVE_HEADERS.has(normalizedKey))
        return value;
    return '[REDACTED]';
}
function sanitizeWebhookHeaderValue(key, value) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === 'x-forwarded-for') {
        return '111.111.111.111';
    }
    if (normalizedKey === 'host' || normalizedKey === 'x-forwarded-host') {
        return SANITIZED_N8N_HOST;
    }
    return sanitizeHeaderValue(key, value);
}
function sanitizeUrl(url) {
    if (url.includes('api.telegram.org')) {
        return url.replace(/(.+api\.telegram\.org\/bot)(\d+:\S+)(\/.+)/, '$1123456789:abcdefghijkl$3');
    }
    return url;
}
function sanitizeWebhookUrl(url) {
    try {
        const parsed = new URL(url);
        return `${SANITIZED_N8N_HOST}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    catch {
        return url;
    }
}
function sanitizeHeaders(headers, sanitizeValue = sanitizeHeaderValue) {
    if (!headers)
        return undefined;
    const sanitized = {};
    if (headers instanceof Headers) {
        headers.forEach((value, key) => {
            sanitized[key] = sanitizeValue(key, value);
        });
        return sanitized;
    }
    for (const [key, value] of Object.entries(headers)) {
        sanitized[key] = sanitizeValue(key, value);
    }
    return sanitized;
}
function sanitizeRecord(record) {
    if (record.type === 'webhook') {
        return {
            ...record,
            url: sanitizeWebhookUrl(record.url),
            headers: sanitizeHeaders(record.headers, sanitizeWebhookHeaderValue) ?? {},
        };
    }
    if (record.type === 'fetch') {
        return {
            ...record,
            url: sanitizeUrl(record.url),
            requestHeaders: sanitizeHeaders(record.requestHeaders),
            responseHeaders: sanitizeHeaders(record.responseHeaders),
        };
    }
    if (record.type === 'api-call') {
        return {
            ...record,
            response: sanitizeApiCallResponse(record.response),
        };
    }
    throw new Error('Unsupported channel integration record type');
}
function sanitizeApiCallResponse(response) {
    if (!response || typeof response !== 'object')
        return response;
    if (response instanceof Response)
        return response;
    if (!('headers' in response) || !(response.headers instanceof Headers))
        return response;
    return {
        ...response,
        headers: sanitizeHeaders(response.headers),
    };
}
function sanitizeSessionId(value) {
    return value.replace(/[^a-zA-Z0-9._-]/g, '-');
}
function defaultSessionId() {
    const ref = process.env.N8N_AGENT_INTEGRATION_RECORDING_REF ?? 'local';
    return `session-${sanitizeSessionId(ref)}-${Date.now()}`;
}
function defaultRecordingDir() {
    return (0, path_1.resolve)(process.cwd(), '.agent-recordings', 'channel-integrations');
}
async function responseToRecordable(response) {
    if (response instanceof Response) {
        return {
            status: response.status,
            headers: response.headers,
            body: await response.clone().text(),
        };
    }
    return response;
}
function getRequestUrl(input) {
    if (typeof input === 'string')
        return input;
    if (input instanceof URL)
        return input.href;
    return input.url;
}
function headersToRecord(headersInit) {
    if (!headersInit)
        return undefined;
    if (headersInit instanceof Headers) {
        const headers = {};
        headersInit.forEach((value, key) => {
            headers[key] = value;
        });
        return headers;
    }
    if (Array.isArray(headersInit)) {
        const headers = {};
        for (const [key, value] of headersInit) {
            headers[key] = value;
        }
        return headers;
    }
    return headersInit;
}
function getRequestMethod(input, init) {
    if (init?.method)
        return init.method;
    if (input instanceof Request)
        return input.method;
    return 'GET';
}
function getRequestHeaders(input, init) {
    return headersToRecord(init?.headers ?? (input instanceof Request ? input.headers : undefined));
}
async function getRequestBody(input, init) {
    if (typeof init?.body === 'string')
        return init.body;
    if (init?.body !== undefined)
        return undefined;
    if (!(input instanceof Request))
        return undefined;
    return await input
        .clone()
        .text()
        .catch(() => undefined);
}
class ChannelIntegrationRecorder {
    constructor(options = {}) {
        this.fetchUrlPatterns = DEFAULT_FETCH_URL_PATTERNS;
        this.pendingRecords = new Set();
        this.enabled =
            options.enabled ?? process.env.N8N_AGENT_INTEGRATION_RECORDING_ENABLED === 'true';
        this.sessionId = sanitizeSessionId(options.sessionId ??
            process.env.N8N_AGENT_INTEGRATION_RECORDING_SESSION_ID ??
            defaultSessionId());
        this.recordingDir =
            options.recordingDir ??
                process.env.N8N_AGENT_INTEGRATION_RECORDING_DIR ??
                defaultRecordingDir();
    }
    get isEnabled() {
        return this.enabled;
    }
    get currentSessionId() {
        return this.sessionId;
    }
    get currentSessionPath() {
        return (0, path_1.join)(this.recordingDir, `${this.sessionId}.jsonl`);
    }
    async recordWebhook(platform, request) {
        if (!this.enabled)
            return;
        await this.recordBestEffort(async () => {
            const headers = {};
            request.headers.forEach((value, key) => {
                headers[key] = value;
            });
            await this.appendRecord({
                type: 'webhook',
                timestamp: Date.now(),
                platform,
                method: request.method,
                url: request.url,
                headers,
                body: await request.clone().text(),
            });
        });
    }
    async recordApiCall(platform, method, args, response, error) {
        if (!this.enabled)
            return;
        await this.recordBestEffort(async () => {
            await this.appendRecord({
                type: 'api-call',
                timestamp: Date.now(),
                platform,
                method,
                args,
                response: await responseToRecordable(response),
                ...(error ? { error: error.message } : {}),
            });
        });
    }
    startFetchRecording(urlPatterns = DEFAULT_FETCH_URL_PATTERNS) {
        if (!this.enabled || this.originalFetch)
            return;
        this.fetchUrlPatterns = urlPatterns;
        this.originalFetch = globalThis.fetch;
        const originalFetch = this.originalFetch;
        globalThis.fetch = async (input, init) => {
            const url = getRequestUrl(input);
            const shouldRecord = this.fetchUrlPatterns.some((pattern) => pattern.test(url));
            if (!shouldRecord)
                return await originalFetch(input, init);
            const startTime = Date.now();
            const requestMethod = getRequestMethod(input, init);
            const requestHeaders = getRequestHeaders(input, init);
            const requestBody = await getRequestBody(input, init);
            let response;
            let error;
            try {
                response = await originalFetch(input, init);
                return response;
            }
            catch (caught) {
                error = caught instanceof Error ? caught : new Error(String(caught));
                throw caught;
            }
            finally {
                let responseHeaders;
                if (response) {
                    responseHeaders = {};
                    response.headers.forEach((value, key) => {
                        responseHeaders[key] = value;
                    });
                }
                const responseBody = response
                    ? await response
                        .clone()
                        .text()
                        .catch(() => undefined)
                    : undefined;
                const record = {
                    type: 'fetch',
                    timestamp: Date.now(),
                    method: requestMethod,
                    url,
                    durationMs: Date.now() - startTime,
                    requestHeaders,
                    requestBody,
                    status: response?.status,
                    responseHeaders,
                    responseBody,
                    ...(error ? { error: error.message } : {}),
                };
                this.trackPendingRecord(this.appendRecord(record).catch(() => { }));
            }
        };
    }
    stopFetchRecording() {
        if (!this.originalFetch)
            return;
        globalThis.fetch = this.originalFetch;
        this.originalFetch = undefined;
    }
    async listSessions() {
        await (0, promises_1.mkdir)(this.recordingDir, { recursive: true });
        const files = await (0, promises_1.readdir)(this.recordingDir);
        const sessions = await Promise.all(files
            .filter((file) => file.endsWith('.jsonl'))
            .map(async (file) => {
            const contents = await (0, promises_1.readFile)((0, path_1.join)(this.recordingDir, file), 'utf8');
            return {
                sessionId: file.slice(0, -'.jsonl'.length),
                entries: contents.split('\n').filter(Boolean).length,
            };
        }));
        return sessions.sort((a, b) => a.sessionId.localeCompare(b.sessionId));
    }
    async getRecords(sessionId = this.sessionId) {
        await this.flush();
        const filePath = (0, path_1.join)(this.recordingDir, `${sanitizeSessionId(sessionId)}.jsonl`);
        const contents = await (0, promises_1.readFile)(filePath, 'utf8');
        return contents
            .split('\n')
            .filter(Boolean)
            .map((line) => (0, n8n_workflow_1.jsonParse)(line));
    }
    async exportRecords(sessionId = this.sessionId) {
        return JSON.stringify(await this.getRecords(sessionId), null, 2);
    }
    async deleteSession(sessionId = this.sessionId) {
        await (0, promises_1.rm)((0, path_1.join)(this.recordingDir, `${sanitizeSessionId(sessionId)}.jsonl`), { force: true });
    }
    async flush() {
        await Promise.all([...this.pendingRecords]);
    }
    async appendRecord(record) {
        await (0, promises_1.mkdir)(this.recordingDir, { recursive: true });
        const { appendFile } = await import('fs/promises');
        await appendFile(this.currentSessionPath, `${JSON.stringify(sanitizeRecord(record))}\n`, 'utf8');
    }
    async recordBestEffort(record) {
        await record().catch(() => { });
    }
    trackPendingRecord(record) {
        this.pendingRecords.add(record);
        void record.finally(() => this.pendingRecords.delete(record));
    }
}
exports.ChannelIntegrationRecorder = ChannelIntegrationRecorder;
exports.channelIntegrationRecorder = new ChannelIntegrationRecorder();
//# sourceMappingURL=channel-integration-recorder.js.map