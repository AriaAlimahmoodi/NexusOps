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
exports.WebhookResponseRelay = exports.OFFLOADED_BODY_KIND_KEY = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const json_size_exceeds_1 = require("@n8n/utils/json/json-size-exceeds");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_stream_1 = require("node:stream");
const webhook_response_too_large_error_1 = require("../errors/webhook-response-too-large.error");
const MIB = 1024 * 1024;
exports.OFFLOADED_BODY_KIND_KEY = '__@N8nOffloadedBodyKind@__';
const IN_MEMORY_MODE = 'default';
const INLINE_STRING_CONTENT_TYPE = 'text/html; charset=utf-8';
const INLINE_JSON_CONTENT_TYPE = 'application/json; charset=utf-8';
const TOO_LARGE_MESSAGE = 'The response is too large to be sent back from the worker';
const TOO_LARGE_FOR_STORE_MESSAGE = 'The response is too large for the binary-data store to hold';
const OFFLOAD_DISABLED_GUIDANCE = 'In scaling mode a response over this size can be stored for the main instance to stream instead of failing. Set N8N_WEBHOOK_RESPONSE_RELAY_OFFLOAD_ENABLED to true on every worker, once every main instance runs a version that reads a stored body, or raise N8N_WEBHOOK_RESPONSE_RELAY_SIZE_MAX.';
const BINARY_DATA_DOCS_LINK = "<a href='https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/use-environment-variables/binary-data' target='_blank'>in the docs</a>";
const NO_STORE_GUIDANCE = `In scaling mode a response over this size is stored for the main instance to stream, which the in-memory binary-data mode cannot do. Set N8N_DEFAULT_BINARY_DATA_MODE to a mode with a store, or raise N8N_WEBHOOK_RESPONSE_RELAY_SIZE_MAX. The modes are described ${BINARY_DATA_DOCS_LINK}.`;
const UNREADABLE_BODY_GUIDANCE = `A response over N8N_WEBHOOK_RESPONSE_RELAY_SIZE_MAX is stored by the instance that produced it, so N8N_DEFAULT_BINARY_DATA_MODE has to name a store every instance can read. The modes are described ${BINARY_DATA_DOCS_LINK}.`;
const NOT_OFFLOADABLE_GUIDANCE = 'In scaling mode a response is relayed to the main instance through the queue, which limits how large it can be. Only a response body can be stored for the main instance to stream instead, so raise N8N_WEBHOOK_RESPONSE_RELAY_SIZE_MAX to relay a payload this large.';
const STORE_LIMIT_GUIDANCE = 'A response over N8N_WEBHOOK_RESPONSE_RELAY_SIZE_MAX is stored for the main instance to stream, so the store applies its own size limit above that one. In database mode raise N8N_BINARY_DATA_DATABASE_MAX_FILE_SIZE, up to the 1 GB a database column holds. The filesystem, s3 and azure modes have no such limit, so setting N8N_DEFAULT_BINARY_DATA_MODE to one of those lifts it, as long as every instance reads the same store.';
const OFFLOADED_BODY_KINDS = ['buffer', 'string', 'json'];
let WebhookResponseRelay = class WebhookResponseRelay {
    constructor(logger, binaryDataService, binaryDataConfig, executionsConfig) {
        this.logger = logger;
        this.binaryDataService = binaryDataService;
        this.binaryDataConfig = binaryDataConfig;
        this.executionsConfig = executionsConfig;
        this.logger = this.logger.scoped('scaling');
    }
    async prepare(response, context) {
        if (!hasResponseBody(response)) {
            this.assertFitsInline(response);
            return response;
        }
        const { body, ...rest } = response;
        const offloadable = asOffloadablePayload(body);
        if (!offloadable) {
            this.assertFitsInline(body instanceof node_stream_1.Readable ? rest : response);
            return response;
        }
        this.assertFitsInline(rest);
        if (!this.exceedsInline(response, offloadable)) {
            return (0, n8n_core_1.encodeBufferBody)(response);
        }
        this.assertOffloadAvailable();
        return await this.offload(response, offloadable, context);
    }
    async restoreOffloadedBody(response, { reclaim, context }) {
        if (!hasResponseBody(response)) {
            return response;
        }
        const offloaded = asOffloadedBody(response);
        if (!offloaded) {
            return response;
        }
        const binaryDataId = offloaded.binaryData.id;
        try {
            const buffer = await this.binaryDataService.getAsBuffer(offloaded.binaryData);
            response.body = deserializeBody(buffer, offloaded.kind);
        }
        catch (error) {
            if (reclaim) {
                throw new n8n_workflow_1.OperationalError('The stored webhook response body could not be read', {
                    cause: error,
                    description: UNREADABLE_BODY_GUIDANCE,
                    extra: { binaryDataId, ...context },
                });
            }
            return this.degradeToEmptyBody(response, offloaded, context, error);
        }
        clearOffloadMarker(response);
        if (reclaim) {
            void this.deleteStoredBody(binaryDataId, context);
        }
        return response;
    }
    async deleteOffloadedBody(response, context) {
        if (hasResponseBody(response)) {
            const offloaded = asOffloadedBody(response);
            if (offloaded) {
                await this.deleteStoredBody(offloaded.binaryData.id, context);
            }
        }
    }
    assertFitsInline(payload) {
        if (exceedsInlineSize(payload, this.maxInlineBytes)) {
            throw new webhook_response_too_large_error_1.WebhookResponseTooLargeError(TOO_LARGE_MESSAGE, {
                description: withInlineLimit(NOT_OFFLOADABLE_GUIDANCE, this.maxInlineMib),
            });
        }
    }
    assertOffloadAvailable() {
        if (!this.executionsConfig.webhookResponseRelayOffloadEnabled) {
            throw new webhook_response_too_large_error_1.WebhookResponseTooLargeError(TOO_LARGE_MESSAGE, {
                description: withInlineLimit(OFFLOAD_DISABLED_GUIDANCE, this.maxInlineMib),
            });
        }
        if (this.binaryDataConfig.mode === IN_MEMORY_MODE) {
            throw new webhook_response_too_large_error_1.WebhookResponseTooLargeError(TOO_LARGE_MESSAGE, {
                description: withInlineLimit(NO_STORE_GUIDANCE, this.maxInlineMib),
            });
        }
    }
    get maxInlineMib() {
        return this.executionsConfig.webhookResponseRelaySizeMaxMiB;
    }
    get maxInlineBytes() {
        return this.maxInlineMib * MIB;
    }
    exceedsInline(response, body) {
        return body.exceeds(this.maxInlineBytes) || (0, json_size_exceeds_1.jsonSizeExceeds)(response, this.maxInlineBytes);
    }
    async offload(response, { kind, serialize, inlineContentType }, { workflowId, executionId }) {
        const existingContentType = contentTypeOf(response.headers);
        const contentType = existingContentType ?? inlineContentType;
        const location = n8n_core_1.FileLocation.ofExecution(workflowId, executionId);
        const stored = await this.storeBody(location, serialize(), contentType);
        if (contentType !== undefined && existingContentType === undefined) {
            response.headers ??= {};
            response.headers['content-type'] = contentType;
        }
        response.body = { binaryData: stored };
        response[exports.OFFLOADED_BODY_KIND_KEY] = kind;
        return response;
    }
    async storeBody(location, body, contentType) {
        let stored;
        try {
            stored = await this.binaryDataService.store(location, body, {
                data: '',
                mimeType: contentType ?? 'application/octet-stream',
                fileName: 'webhook-response',
            });
        }
        catch (error) {
            if (error instanceof n8n_core_1.FileTooLargeError) {
                throw new webhook_response_too_large_error_1.WebhookResponseTooLargeError(TOO_LARGE_FOR_STORE_MESSAGE, {
                    description: withResponseSize(STORE_LIMIT_GUIDANCE, body.length),
                    cause: error,
                });
            }
            throw error;
        }
        if (!stored.id) {
            throw new n8n_workflow_1.OperationalError('Binary-data store did not persist the webhook response body');
        }
        return stored;
    }
    degradeToEmptyBody(response, offloaded, context, error) {
        this.logger.warn('Failed to restore an offloaded webhook response body', {
            binaryDataId: offloaded.binaryData.id,
            ...context,
            error,
        });
        response.body = emptyBodyOf(offloaded.kind);
        clearOffloadMarker(response);
        return response;
    }
    async deleteStoredBody(binaryDataId, context) {
        try {
            await this.binaryDataService.deleteManyByBinaryDataId([binaryDataId]);
        }
        catch (error) {
            this.logger.warn('Failed to delete an offloaded webhook response body', {
                binaryDataId,
                ...context,
                error,
            });
        }
    }
};
exports.WebhookResponseRelay = WebhookResponseRelay;
exports.WebhookResponseRelay = WebhookResponseRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.BinaryDataService, n8n_core_1.BinaryDataConfig, config_1.ExecutionsConfig])
], WebhookResponseRelay);
function withInlineLimit(guidance, limitInMib) {
    return `The limit is ${limitInMib} MiB. ${guidance}`;
}
function withResponseSize(guidance, byteLength) {
    const sizeInMib = Math.round((byteLength / MIB) * 100) / 100;
    return `The response is ${sizeInMib} MiB. ${guidance}`;
}
function base64Size(byteLength) {
    return Math.ceil(byteLength / 3) * 4;
}
function exceedsInlineSize(payload, maxBytes) {
    const offloadable = asOffloadablePayload(payload);
    if (offloadable) {
        return offloadable.exceeds(maxBytes);
    }
    return !(payload instanceof node_stream_1.Readable) && (0, json_size_exceeds_1.jsonSizeExceeds)(payload, maxBytes);
}
function asOffloadablePayload(payload) {
    if (Buffer.isBuffer(payload)) {
        return {
            kind: 'buffer',
            exceeds: (maxBytes) => base64Size(payload.length) > maxBytes,
            serialize: () => payload,
        };
    }
    if (typeof payload === 'string') {
        return {
            kind: 'string',
            exceeds: (maxBytes) => Buffer.byteLength(payload, 'utf8') > maxBytes,
            serialize: () => Buffer.from(payload, 'utf8'),
            inlineContentType: INLINE_STRING_CONTENT_TYPE,
        };
    }
    if (isPlainJson(payload)) {
        return {
            kind: 'json',
            exceeds: (maxBytes) => (0, json_size_exceeds_1.jsonSizeExceeds)(payload, maxBytes),
            serialize: () => Buffer.from(JSON.stringify(payload), 'utf8'),
            inlineContentType: INLINE_JSON_CONTENT_TYPE,
        };
    }
    return undefined;
}
function deserializeBody(buffer, kind) {
    switch (kind) {
        case 'buffer':
            return buffer;
        case 'string':
            return buffer.toString('utf8');
        case 'json':
            return (0, n8n_workflow_1.jsonParse)(buffer.toString('utf8'));
    }
}
function emptyBodyOf(kind) {
    switch (kind) {
        case 'buffer':
            return Buffer.alloc(0);
        case 'string':
            return '';
        case 'json':
            return {};
    }
}
function asOffloadedBody(response) {
    if (!isBinaryDataReference(response.body)) {
        return undefined;
    }
    const marked = response;
    const kind = marked[exports.OFFLOADED_BODY_KIND_KEY];
    if (isOffloadedBodyKind(kind)) {
        return {
            binaryData: response.body.binaryData,
            kind,
        };
    }
    return undefined;
}
function isOffloadedBodyKind(value) {
    return typeof value === 'string' && OFFLOADED_BODY_KINDS.some((kind) => kind === value);
}
function clearOffloadMarker(response) {
    const marked = response;
    delete marked[exports.OFFLOADED_BODY_KIND_KEY];
}
function hasResponseBody(response) {
    return typeof response === 'object' && response !== null && 'body' in response;
}
function isPlainJson(payload) {
    return (typeof payload === 'object' &&
        payload !== null &&
        !Buffer.isBuffer(payload) &&
        !(payload instanceof node_stream_1.Readable) &&
        !isBinaryDataReference(payload));
}
function isBinaryDataReference(body) {
    if (typeof body !== 'object' || body === null || !('binaryData' in body)) {
        return false;
    }
    const { binaryData } = body;
    return (typeof binaryData === 'object' &&
        binaryData !== null &&
        'id' in binaryData &&
        typeof binaryData.id === 'string');
}
function contentTypeOf(headers) {
    const entry = Object.entries(headers ?? {}).find(([name]) => name.toLowerCase() === 'content-type');
    return typeof entry?.[1] === 'string' ? entry[1] : undefined;
}
//# sourceMappingURL=webhook-response-relay.js.map