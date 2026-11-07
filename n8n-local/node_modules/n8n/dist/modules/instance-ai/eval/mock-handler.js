"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDateAnchors = void 0;
exports.createLlmMockHandler = createLlmMockHandler;
exports.isMockErrorSentinel = isMockErrorSentinel;
exports.extractDateFilterConstraints = extractDateFilterConstraints;
exports.findDateFilterViolations = findDateFilterViolations;
exports.substituteBinaryMimeParts = substituteBinaryMimeParts;
const tool_1 = require("@n8n/agents/tool");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const date_anchors_1 = require("./date-anchors");
const mock_quirks_1 = require("./mock-quirks");
const node_config_1 = require("./node-config");
const provider_shapes_1 = require("./provider-shapes");
const request_binary_redactor_1 = require("./request-binary-redactor");
const request_sanitizer_1 = require("./request-sanitizer");
var date_anchors_2 = require("./date-anchors");
Object.defineProperty(exports, "buildDateAnchors", { enumerable: true, get: function () { return date_anchors_2.buildDateAnchors; } });
const MOCK_SYSTEM_PROMPT = `You generate realistic HTTP responses for one specific request, mocking an API in n8n workflow evaluation.

You get everything you need in the user message: the request (service, method, URL, body, query), the n8n node's parameters, and optional context (globalContext, nodeHint, scenarioHints).

**Procedure — follow in order:**
1. Call \`get_endpoint_quirks\` first, always. It returns any known guidance specific to this endpoint, or confirms there are none. Treat its output as authoritative.
2. Generate the response that matches the real API, the node config, scenario context, and any quirk guidance from step 1.
3. Call \`submit_response\` to deliver the response. If it returns a message starting with "Invalid:", fix the input and call it again — your response only counts once it is accepted. Do not write the response as text.

**Write operations (POST / PUT / PATCH that create or modify a resource):**
Return the FULL resource object the API produces on success — not a minimal acknowledgement-only response. When the API has multiple response variants for one endpoint, default to the FULL/complete one. Use a partial/minimal variant only if the request body contains the explicit field that triggers it (e.g. \`template\`, \`async: true\`).

Each request is mocked independently. Even when the same node makes multiple similar calls in a workflow, every call must produce a fully-shaped response on its own — never shortcut later calls. (Byte-identical repeats of a request you already answered are served from a cache and never reach you — any request you DO see is distinct and needs its own full response.)

Response SHAPE comes from your knowledge of the real API; DATA VALUES come from the node config. Use names/IDs from the config exactly (case-sensitive).

**Hints carry data, not layout.** The Data, Hint and Scenario lines were written before the run, without seeing this request. Take facts from them: names, IDs, values, counts, dates, statuses, and which entity fails. Take the response LAYOUT only from the real API: the endpoint quirks and your own knowledge of this endpoint. When a hint describes a layout (JSON, field paths, "return {...}") or what the n8n node outputs after its own processing (simplified records, rows keyed by column header, parsed JSON, json.data), use its values and ignore its layout. A node can send several requests, and its hint can describe another one of them (for example the append when this request reads metadata): use only the facts that fit THIS request. Decide what kind of call this is from the request itself: the HTTP method, the URL path and, when one path serves many kinds of call (for example GraphQL), the operation in the body (a GraphQL \`query\` reads, a \`mutation\` writes). Do not decide from the node's name, the node's operation setting or the hint. Return that call's own response. For example, when a node that appends a row first reads the sheet, that read returns the sheet as it is now, not the append result.

**Honor explicit values from the scenario and hints.** When the scenarioHints, nodeHint, or globalContext state a specific value — a quantity with a unit, a percentage, a monetary amount ("$1,200"), a count ("3 rows"), a threshold, an ID, or a name — reproduce that EXACT value in the response. Do NOT round it, soften it toward a "more typical" reading, or substitute your own estimate: the stated value is the test's intent, and downstream nodes (IF/Switch gates, filters, sums) compare against it. Emit the exact number of enumerated items the context describes. This extends to per-item constraints: when the scenario says EVERY/ALL items share a property (a literal substring every title must contain, a minimum every row must exceed), EVERY item you generate must satisfy it — check each item against the constraint character-by-character before responding (near-miss variants of a required literal fail the test). Only invent a value when the context gives none for that field. If a nodeHint and the scenario disagree, the scenario wins. When the context assigns an error or missing-data condition to a specific entity (one channel, one user, one record), compare THIS request's parameters (URL, query, body) against that entity: return the error response ONLY when this request targets it, and a normal success response for every other entity — an error scenario is only tested if the matching request actually fails.

**Honor request filters.** When the request narrows results — a date-range constraint (\`gte\`/\`lte\`/\`since\`/\`after\`/\`before\` params, or filter variables inside a GraphQL query), a status/type filter, a search query, or a \`limit\` — EVERY record in your response MUST satisfy it. Never include records outside the requested window "for realism": workflows re-filter and count your records against the real clock, and one out-of-window item changes the counts the test asserts. For date filters, resolve the requested window against the Date anchors and double-check every returned timestamp falls inside it. When the scenario says records exist "in the last N days", place them safely inside that window (e.g. 2–5 days ago), never on the boundary and never on training-data dates. When the scenario ALSO describes records outside the window (e.g. "two issues from 3 weeks ago"), those records exist in storage but the API filters them out server-side — EXCLUDE them from this response entirely; never shift their dates into the window to keep them visible (their age is part of the test's setup, and the excluded records are how the test verifies the filter works).

**Node response-handling options are not part of the body.** The node config may include options that control how n8n post-processes the response — \`fullResponse\`, \`responseFormat\`, \`outputPropertyName\`, pagination. These are applied AFTER you return and must NOT change the body you produce: always return the raw body the real API sends over the wire. Never reshape the body to mimic them — a body shaped like \`{ statusCode, headers, body }\` (mimicking \`fullResponse\`) or \`{ <outputPropertyName>: ... }\` is wrong.

**Response envelope.** Return the body exactly as the real service sends it over the wire, including any top-level wrapper the API puts around results — e.g. \`{ "data": [...] }\`, \`{ "results": [...] }\`, \`{ "items": [...] }\`, \`{ "ok": true, "result": ... }\`. Match the real API's top-level shape exactly: many list endpoints wrap their items, but plenty return a bare top-level array (e.g. an endpoint that returns an array of IDs). Follow what the real API actually returns — don't default to wrapping a bare-array response, and don't strip a wrapper the API really uses.

Node-config patterns to know:
  - "__rl" object: "value" is the selected resource id
  - "schema" array: each entry's "id" is the response field name (NOT "displayName"). e.g. {id:"timestamp",displayName:"Timestamp"} → response uses "timestamp"
  - Strings starting with "=" are expressions (ignore)

**Time-relative fields.** The user prompt ends with a "## Date anchors" block listing today's date plus a handful of relative anchors (yesterday, 7 days ago, etc.). EVERY timestamp, date, hourly/daily entry, and time-relative field in your response MUST be derived from those anchors — never from training data or from example dates you remember for this API. Workflows commonly filter mock responses by today's date; values outside the current window are silently discarded and the scenario fails.

Match THIS request only (URL + method): a node may make multiple sequential calls; reply to the specific one shown. Echo identifiers, placeholders, and reference values from the request back into the response.

**Pagination.** Unless the scenario defines pages, the first page holds ALL the data: return it as one page, and make it the last page exactly the way THIS API marks its last page. APIs differ, and a wrong marker makes the client ask for more pages forever. Some APIs leave the next-page field out of the last page (Airtable \`offset\`, Google \`nextPageToken\`). Some always send it and set it to \`null\` on the last page (Asana \`next_page\`, list endpoints with a \`next\` link). Some set a has-more flag to \`false\` (Notion and Stripe \`has_more\`). Use this API's own convention, and never copy another API's marker. So, unless the scenario defines pages, a request for any later page (a page number above the first, or an offset, cursor or token) gets this API's empty last page: the same envelope, no items, and the same last-page marker. Never serve items again on a later page.

**Keep list responses small.** Generate the MINIMUM data that satisfies the request, scenario, and workflow logic. For list/feed/forecast endpoints, return only as many entries as the downstream logic needs — a 5-day hourly forecast does not need all 40 entries, just enough to cover the window the workflow filters on (default 5-8 entries, at most ~20). Exception: when the scenario, hints, or the request's own parameters state an exact count or a larger dataset, honor that exactly — never shrink an explicitly-specified dataset. Oversized responses are slow to generate and risk aborting the whole request.

For APIs that return empty responses on success (204/202), call submit_response with type="json" and body={}.

**Binary / file responses.** Pick \`type: "binary"\` when the request URL or node parameters indicate a file download — Telegram \`getFile\` / \`/file/bot...\`, Google Drive \`alt=media\`, Dropbox \`/files/download\`, OneDrive \`/items/{id}/content\`, S3 \`GetObject\`, OpenAI \`audio/transcriptions\` source file, or any path containing \`/download\`, \`/file\`, \`/attachment\`, \`/media\`, \`/image\`, \`/voice\`, \`/audio\`, \`/export\`. Always set \`contentType\` (real MIME like \`application/pdf\`, \`audio/ogg\`, \`image/png\`) and \`filename\` (with the correct extension). For a PDF whose content the scenario or node hints state, also put that content in \`textBody\` as plain text — the harness writes it into the PDF; without it the PDF has no text. Use \`sizeHint\` only when the scenario hints mention file size constraints (e.g. "rejects files > 100KB"). Do NOT pick \`binary\` for JSON metadata endpoints like Slack \`files.upload\`, \`files.info\`, or Telegram \`getFile\` (which returns a JSON envelope describing the file — the binary comes from the follow-up \`/file/bot.../path\` request). Exception: when the document at a download/export path is itself textual (CSV, XML, HTML, plain text) and the scenario or node hints specify its contents, use \`type: "text"\` with the exact document — reserve \`binary\` for opaque formats (PDF, images, audio, video, archives).

**Raw text / non-JSON responses.** When the real endpoint returns a non-JSON text document — XML/SOAP, CSV, HTML, RSS/Atom, plain text — use \`type: "text"\` and put the EXACT raw document in \`textBody\`, with \`contentType\` set to the real MIME (\`text/xml\`, \`application/xml\`, \`text/csv\`, \`text/html\`, \`text/plain\`). NEVER wrap such a document inside a JSON object like \`{"data": "<?xml..."}\` — the node consumes the raw text, and a JSON wrapper corrupts it. SOAP endpoints return the full SOAP envelope as \`textBody\`; SOAP faults use \`type: "error"\` with the fault XML in \`textBody\`.`;
const DEFAULT_MAX_RETRIES = 2;
const ERROR_PREVIEW_MAX = 400;
const ERROR_DETAIL_MAX = 300;
const API_DOCS_NOTE = 'No API documentation is attached. Generate the response based on your knowledge of this API. Follow standard REST conventions for the HTTP method: GET returns resource data, POST returns the created resource, PUT/PATCH returns the updated resource, DELETE returns 204 or confirmation.';
const LLM_CALL_TIMEOUT_MS = 120_000;
const LLM_CALL_RETRY_TIMEOUT_MS = 300_000;
const CACHED_REPLY_DELAY_MS = 20;
function createLlmMockHandler(options) {
    const nodeConfigCache = new Map();
    const responseCache = new Map();
    return async (requestOptions, node) => {
        if (options?.signal?.aborted) {
            throw new n8n_workflow_1.OperationalError('The eval run has ended, so this mocked request was cancelled');
        }
        try {
            if (!nodeConfigCache.has(node.name)) {
                nodeConfigCache.set(node.name, (0, node_config_1.extractNodeConfig)(node));
            }
            const cacheKey = buildMockCacheKey(requestOptions, node.name);
            const cached = cacheKey ? responseCache.get(cacheKey) : undefined;
            if (cached) {
                di_1.Container.get(backend_common_1.Logger).debug(`[EvalMock] Serving cached mock for ${requestOptions.method ?? 'GET'} ${extractEndpoint(requestOptions.url)} ("${node.name}")`);
                await (0, sleep_1.sleep)(CACHED_REPLY_DELAY_MS);
                return cloneMockResponse(await cached);
            }
            const pending = generateMockResponse(requestOptions, node, {
                scenarioHints: options?.scenarioHints,
                globalContext: options?.globalContext,
                nodeHint: options?.nodeHints?.[node.name],
                pinnedOutputs: options?.pinnedOutputs,
                nodeConfig: nodeConfigCache.get(node.name) ?? '',
                maxRetries: options?.maxRetries ?? DEFAULT_MAX_RETRIES,
            });
            if (cacheKey) {
                responseCache.set(cacheKey, pending);
                void pending.then((response) => {
                    if (isMockErrorSentinel(response) || softFallbackResponses.has(response)) {
                        responseCache.delete(cacheKey);
                    }
                }, () => responseCache.delete(cacheKey));
            }
            return cloneMockResponse(await pending);
        }
        catch (error) {
            return buildPipelineErrorResponse(error, requestOptions, node.name);
        }
    };
}
const softFallbackResponses = new WeakSet();
function cloneMockResponse(response) {
    const body = Buffer.isBuffer(response.body)
        ? Buffer.from(response.body)
        : response.body !== null && typeof response.body === 'object'
            ? structuredClone(response.body)
            : response.body;
    return { ...response, body, headers: { ...response.headers } };
}
function buildPipelineErrorResponse(error, request, nodeName) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error && error.stack ? error.stack.replace(/\s*\n\s*/g, ' <- ') : '(no stack)';
    di_1.Container.get(backend_common_1.Logger).error(`[EvalMock] Mock pipeline error for "${nodeName}" (${request.method ?? 'GET'} ${extractEndpoint(request.url ?? '')}): ${message} | stack: ${stack}`);
    return {
        body: { _evalMockError: true, message: `Mock pipeline error: ${message}` },
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
    };
}
function buildMockCacheKey(request, nodeName) {
    try {
        const bodyKey = request.body === undefined
            ? ''
            : JSON.stringify((0, request_binary_redactor_1.redactBinaryBody)(request.body, getContentType(request.headers)));
        const qsKey = request.qs ? JSON.stringify(request.qs) : '';
        return [nodeName, request.method ?? 'GET', request.url, qsKey, bodyKey].join('\u0000');
    }
    catch {
        return undefined;
    }
}
function isMockErrorSentinel(response) {
    const body = response.body;
    return (typeof body === 'object' && body !== null && !Array.isArray(body) && '_evalMockError' in body);
}
async function generateMockResponse(request, node, context) {
    if (!request.url) {
        return buildMissingUrlResponse(node);
    }
    const serviceName = extractServiceName(request.url);
    const endpoint = extractEndpoint(request.url);
    const dateAnchors = (0, date_anchors_1.buildDateAnchors)(new Date());
    const sections = [
        '## Request',
        `Service: ${serviceName}`,
        `Node: "${node.name}" (${node.type})`,
        (request.method ?? 'GET') + ' ' + endpoint,
        'Generate the response for this EXACT endpoint and method.',
    ];
    if (request.body) {
        const binarySafe = (0, request_binary_redactor_1.redactBinaryBody)(request.body, getContentType(request.headers));
        const sanitized = (0, request_sanitizer_1.redactSecretKeys)(binarySafe);
        const serialized = (0, request_sanitizer_1.truncateForLlm)(JSON.stringify(sanitized));
        sections.push(`Body: ${serialized}`);
    }
    if (request.qs && Object.keys(request.qs).length > 0) {
        const sanitizedQs = (0, request_sanitizer_1.redactSecretKeys)(request.qs);
        sections.push(`Query: ${JSON.stringify(sanitizedQs)}`);
    }
    const isGraphQL = endpoint.includes('/graphql') ||
        (typeof request.body === 'object' && request.body !== null && 'query' in request.body);
    if (isGraphQL) {
        sections.push('', '## GraphQL format requirement');
        sections.push('This is a GraphQL endpoint. ALL responses MUST use GraphQL response format:', '- Success: { "data": { ...fields matching the query... } }', '- Error: { "errors": [{ "message": "...", "extensions": { "code": "..." } }], "data": null }', 'Never return flat REST-style error objects.');
    }
    sections.push('', '## API documentation', API_DOCS_NOTE);
    if (context.nodeConfig) {
        sections.push('', '## Node Configuration', context.nodeConfig);
    }
    if (context.globalContext || context.nodeHint || context.scenarioHints) {
        sections.push('', '## Context');
        if (context.globalContext)
            sections.push(`Data: ${context.globalContext}`);
        if (context.nodeHint)
            sections.push(`Hint: ${context.nodeHint}`);
        if (context.scenarioHints) {
            sections.push(`Scenario: ${context.scenarioHints}`);
            sections.push(isGraphQL
                ? '(For error scenarios, use GraphQL error format with "data": null. Don\'t use "type": "error" wrapper.)'
                : '(Use "error" type with appropriate statusCode for error scenarios.)');
        }
    }
    if (context.pinnedOutputs) {
        sections.push('', '## Pinned node outputs (authoritative)');
        sections.push('These nodes already have fixed outputs in this execution. Your response MUST stay consistent with them — reuse the same entities, IDs, statuses, and timestamps wherever the scenario implies they refer to the same data (e.g. "stored record matches current status").');
        sections.push(context.pinnedOutputs);
    }
    sections.push('', '## Date anchors', dateAnchors);
    const userPrompt = sections.join('\n');
    const safeUrl = extractEndpoint(request.url);
    let lastError = '';
    const requestPath = extractEndpointPath(request.url);
    const requestMethod = request.method ?? 'GET';
    const requestHostname = extractHostname(request.url);
    const dateConstraints = extractDateFilterConstraints(request.body, request.qs);
    for (let attempt = 0; attempt <= context.maxRetries; attempt++) {
        try {
            const { spec, softOnly } = await callLlm(userPrompt, {
                serviceName,
                method: requestMethod,
                pathname: requestPath,
                hostname: requestHostname,
            }, attempt === 0 ? LLM_CALL_TIMEOUT_MS : LLM_CALL_RETRY_TIMEOUT_MS, dateConstraints);
            applyEndpointNormalizers(request, spec);
            (0, provider_shapes_1.applyProviderShapeNormalizers)({ method: requestMethod, pathname: requestPath, hostname: requestHostname }, spec);
            const response = materializeSpec(spec);
            if (softOnly)
                softFallbackResponses.add(response);
            return response;
        }
        catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            if (attempt < context.maxRetries) {
                di_1.Container.get(backend_common_1.Logger).warn(`[EvalMock] Mock generation failed for ${request.method ?? 'GET'} ${safeUrl}, retrying (${attempt + 1}/${context.maxRetries}): ${lastError}`);
            }
        }
    }
    di_1.Container.get(backend_common_1.Logger).error(`[EvalMock] Mock generation failed for ${request.method ?? 'GET'} ${safeUrl} after ${context.maxRetries + 1} attempts: ${lastError}`);
    return {
        body: { _evalMockError: true, message: `Mock generation failed: ${lastError}` },
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
    };
}
function buildMissingUrlResponse(node) {
    const params = node.parameters ?? {};
    const resource = typeof params.resource === 'string' ? params.resource : undefined;
    const operation = typeof params.operation === 'string' ? params.operation : undefined;
    const configured = resource || operation
        ? ` (configured resource/operation: "${resource ?? '?'}" / "${operation ?? '?'}")`
        : '';
    di_1.Container.get(backend_common_1.Logger).warn(`[EvalMock] Request from "${node.name}" (${node.type}) has no URL${configured} — returning 400 instead of mocking`);
    return {
        body: {
            error: {
                message: `Invalid request: the node sent an HTTP request without a URL${configured}. This means the node's routing produced an empty request — typically the selected resource/operation does not exist on node type "${node.type}". Fix the node configuration or use a node type that supports this operation.`,
            },
        },
        headers: { 'content-type': 'application/json' },
        statusCode: 400,
    };
}
const MIN_DATE_KEY = /^(gte|gt|since|after|created_?after|updated_?after|from|start_?(date|time))$/i;
const MAX_DATE_KEY = /^(lte|lt|before|until|to|end_?(date|time))$/i;
const DATE_FILTER_TOLERANCE_MS = 24 * 3600 * 1000;
function parseFilterDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value))
        return undefined;
    const ts = Date.parse(value);
    if (Number.isNaN(ts))
        return undefined;
    const twoYearsMs = 2 * 365 * 24 * 3600 * 1000;
    if (Math.abs(ts - Date.now()) > twoYearsMs)
        return undefined;
    return ts;
}
function extractDateFilterConstraints(body, qs) {
    const constraints = [];
    const visit = (value, depth) => {
        if (depth > 6 || value === null || typeof value !== 'object')
            return;
        if (Buffer.isBuffer(value))
            return;
        if (Array.isArray(value)) {
            for (const entry of value)
                visit(entry, depth + 1);
            return;
        }
        for (const [key, child] of Object.entries(value)) {
            if (MIN_DATE_KEY.test(key)) {
                const ts = parseFilterDate(child);
                if (ts !== undefined)
                    constraints.push({ label: key, min: ts });
            }
            else if (MAX_DATE_KEY.test(key)) {
                const ts = parseFilterDate(child);
                if (ts !== undefined)
                    constraints.push({ label: key, max: ts });
            }
            visit(child, depth + 1);
        }
    };
    visit(body, 0);
    visit(qs, 0);
    return constraints;
}
function findDateFilterViolations(body, constraints) {
    if (constraints.length === 0 || body === undefined || body === null)
        return [];
    let serialized;
    try {
        serialized = JSON.stringify(body);
    }
    catch {
        return [];
    }
    const mins = constraints.filter((c) => c.min !== undefined).map((c) => c.min);
    const maxes = constraints.filter((c) => c.max !== undefined).map((c) => c.max);
    const loosestMin = mins.length > 0 ? Math.min(...mins) - DATE_FILTER_TOLERANCE_MS : undefined;
    const loosestMax = maxes.length > 0 ? Math.max(...maxes) + DATE_FILTER_TOLERANCE_MS : undefined;
    const violations = [];
    const seen = new Set();
    const pattern = /"([A-Za-z0-9_]+)":"(\d{4}-\d{2}-\d{2}[^"]*)"/g;
    let match;
    while ((match = pattern.exec(serialized)) !== null && violations.length < 3) {
        const [, key, rawDate] = match;
        const ts = Date.parse(rawDate);
        if (Number.isNaN(ts))
            continue;
        const tooOld = loosestMin !== undefined && ts < loosestMin;
        const tooNew = loosestMax !== undefined && ts > loosestMax;
        if (!tooOld && !tooNew)
            continue;
        const entry = `${key}=${rawDate}`;
        if (seen.has(entry))
            continue;
        seen.add(entry);
        violations.push(entry);
    }
    return violations;
}
function describeDateConstraints(constraints) {
    return constraints
        .map((c) => {
        const bound = c.min ?? c.max;
        const side = c.min !== undefined ? '>=' : '<=';
        return `${c.label} ${side} ${new Date(bound).toISOString().slice(0, 10)}`;
    })
        .join(', ');
}
const submitResponseSchema = zod_1.z.object({
    type: zod_1.z
        .enum(['json', 'text', 'binary', 'error'])
        .describe('"json" for JSON responses; "text" for non-JSON text documents (XML/SOAP, CSV, HTML, plain text); "binary" for file downloads; "error" for non-2xx responses.'),
    body: zod_1.z
        .union([zod_1.z.record(zod_1.z.unknown()), zod_1.z.array(zod_1.z.unknown()), zod_1.z.null()])
        .optional()
        .describe('The decoded JSON response body. Must be an object — the API\'s real response envelope (most list endpoints wrap items in e.g. `data` / `results` / `items`); use a bare array only if the real API returns a top-level array; or null for empty 204-style responses. Required for type="json" and for JSON-style type="error". Omit for type="text" and type="binary".'),
    textBody: zod_1.z
        .string()
        .optional()
        .describe('The raw text document exactly as the service would send it (e.g. "<?xml version=\\"1.0\\"?>..."). Required for type="text"; allowed with type="error" when the service returns a text/XML error document; with type="binary" and a PDF, the document\'s text as plain text. Omit otherwise.'),
    statusCode: zod_1.z
        .number()
        .int()
        .optional()
        .describe('HTTP status code. Required for type="error". Omit for json/text/binary.'),
    contentType: zod_1.z
        .string()
        .optional()
        .describe('MIME type. Required for type="binary". For type="text", the document MIME (e.g. "text/xml", "text/csv"; defaults to "text/plain"). Omit for json.'),
    filename: zod_1.z.string().optional().describe('Filename for type="binary". Omit otherwise.'),
    sizeHint: zod_1.z
        .enum(['small', 'medium', 'large'])
        .optional()
        .describe('Optional padding hint for type="binary". "small" (default) is the minimum valid fixture; "medium" pads to ~64KB; "large" pads to ~1MB. Use only when the scenario hints mention file size constraints.'),
});
function looksLikeJsonDocument(text) {
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('['))
        return false;
    try {
        const parsed = JSON.parse(trimmed);
        return typeof parsed === 'object' && parsed !== null;
    }
    catch {
        return false;
    }
}
function createSubmitResponseTool(capture, requestInfo, dateConstraints = []) {
    return new tool_1.Tool('submit_response')
        .description('Submit your final mock HTTP response. Submit one response; if the result starts with "Invalid:", fix the input and call submit_response again.')
        .input(submitResponseSchema)
        .handler(async (input) => {
        const reject = (message) => {
            capture.lastRejection = message;
            return message;
        };
        if (input.type === 'text') {
            if (typeof input.textBody !== 'string') {
                return reject('Invalid: type="text" requires textBody (the raw text document as a string). Call submit_response again with textBody set.');
            }
            if (input.statusCode !== undefined) {
                return reject('Invalid: type="text" is always a 200 response. For a non-2xx text/XML response, resubmit with type="error", the document in textBody, and the statusCode.');
            }
            if (input.contentType?.toLowerCase().includes('json') ||
                looksLikeJsonDocument(input.textBody)) {
                return reject('Invalid: this looks like a JSON response. Resubmit with type="json" and the decoded JSON in body — type="text" is only for non-JSON documents.');
            }
        }
        if (input.type === 'json' && typeof input.textBody === 'string') {
            capture.spec = input;
            capture.softOnly = true;
            return reject('Invalid: textBody is not allowed with type="json". If the endpoint returns a non-JSON text document, resubmit with type="text"; otherwise resubmit with the JSON in body.');
        }
        if (input.type === 'error' &&
            typeof input.textBody === 'string' &&
            input.body !== undefined) {
            return reject('Invalid: type="error" takes either body (JSON error) or textBody (text/XML error document), not both. Resubmit with exactly one.');
        }
        if (input.type === 'json' && !capture.shapeWarned) {
            const violation = (0, provider_shapes_1.findProviderShapeViolation)(requestInfo, input.body);
            if (violation) {
                capture.shapeWarned = true;
                capture.spec = input;
                capture.softOnly = true;
                return reject(violation);
            }
        }
        if (input.type === 'json' && !capture.dateFilterWarned && dateConstraints.length > 0) {
            const violations = findDateFilterViolations(input.body, dateConstraints);
            if (violations.length > 0) {
                capture.dateFilterWarned = true;
                capture.spec = input;
                capture.softOnly = true;
                return reject(`Invalid: the request filters by date (${describeDateConstraints(dateConstraints)}), but the response contains date values outside that window: ${violations.join(', ')}. REMOVE every record outside the requested window — the real API filters them out server-side. Do NOT change a record's dates to pull it inside the window: stored records keep the dates the scenario assigns them (a record's age is often exactly what the test checks). Only if a flagged value belongs to a nested unrelated entity (e.g. a creator's registration date — not one of the filtered records) resubmit the same response unchanged to confirm it.`);
            }
        }
        capture.spec = input;
        capture.softOnly = false;
        return 'Response submitted.';
    })
        .build();
}
function createQuirksLookupTool(serviceName, method, pathname, hostname) {
    return new tool_1.Tool('get_endpoint_quirks')
        .description('Returns guidance about known mocking quirks for the current request. Always call before submit_response.')
        .input(zod_1.z.object({}))
        .handler(async () => {
        const guidance = (0, mock_quirks_1.findMockQuirks)(serviceName, method, pathname, hostname);
        if (guidance.length === 0) {
            return 'No specific quirks for this endpoint. Follow the real API and the system rules.';
        }
        return guidance.join('\n\n');
    })
        .build();
}
async function callLlm(userPrompt, requestInfo, timeoutMs, dateConstraints = []) {
    const capture = {};
    const agent = (0, instance_ai_1.createEvalAgent)('eval-mock-responder', {
        instructions: MOCK_SYSTEM_PROMPT,
        cache: true,
    })
        .tool(createQuirksLookupTool(requestInfo.serviceName, requestInfo.method, requestInfo.pathname, requestInfo.hostname))
        .tool(createSubmitResponseTool(capture, {
        method: requestInfo.method,
        pathname: requestInfo.pathname,
        hostname: requestInfo.hostname,
    }, dateConstraints));
    const result = await agent.generate(userPrompt, {
        abortSignal: AbortSignal.timeout(timeoutMs),
    });
    if (!capture.spec) {
        const text = (0, instance_ai_1.extractText)(result);
        const edge = ERROR_PREVIEW_MAX / 2;
        const preview = text.length > ERROR_PREVIEW_MAX ? `${text.slice(0, edge)}…${text.slice(-edge)}` : text;
        const errDetail = result.error
            ? result.error instanceof Error
                ? result.error.message
                : JSON.stringify(result.error).slice(0, ERROR_DETAIL_MAX)
            : '';
        const errPart = errDetail ? ` error=${errDetail}` : '';
        const what = capture.lastRejection
            ? `Agent's submit_response was rejected and not resubmitted (${capture.lastRejection})`
            : 'Agent did not call submit_response';
        throw new Error(`${what}. finishReason=${result.finishReason ?? 'unknown'}${errPart} text="${preview.replace(/\s+/g, ' ').trim()}"`);
    }
    if (capture.softOnly) {
        di_1.Container.get(backend_common_1.Logger).warn(`[EvalMock] Serving soft-captured json body — submit_response was rejected (${capture.lastRejection ?? 'unknown reason'}) and never resubmitted`);
    }
    return { spec: capture.spec, softOnly: capture.softOnly === true };
}
function applyEndpointNormalizers(request, spec) {
    normalizeGmailRawMessage(request, spec);
    normalizeDriveResumableInit(request, spec);
}
function normalizeDriveResumableInit(request, spec) {
    const url = request.url;
    if (!/\/upload\/drive\/v[23]\/files/i.test(url))
        return;
    if ((request.method ?? 'GET').toUpperCase() === 'PUT')
        return;
    if (url.includes('upload_id='))
        return;
    const uploadType = request.qs?.uploadType ?? extractQueryParam(url, 'uploadType');
    if (uploadType !== 'resumable')
        return;
    spec.type = 'json';
    spec.body = {};
    spec.statusCode = 200;
    spec.headers = {
        ...spec.headers,
        location: `${url}${url.includes('?') ? '&' : '?'}upload_id=eval-resumable-upload`,
    };
}
function extractQueryParam(url, name) {
    try {
        return new URL(url).searchParams.get(name) ?? undefined;
    }
    catch {
        return undefined;
    }
}
function normalizeGmailRawMessage(request, spec) {
    if (spec.type !== 'json')
        return;
    if (typeof spec.body !== 'object' || spec.body === null || Array.isArray(spec.body))
        return;
    if (!/\/gmail\/v1\/users\/[^/]+\/messages\//.test(extractEndpointPath(request.url)))
        return;
    const body = spec.body;
    if (typeof body.raw !== 'string' || body.raw.length === 0)
        return;
    if (!looksLikeRfc822(body.raw))
        return;
    body.raw = Buffer.from(substituteBinaryMimeParts(body.raw), 'utf8').toString('base64url');
}
const BINARY_PART_RE = /(content-type:\s*(application\/pdf|image\/(?:png|jpeg|jpg|gif|webp))[^]*?\r?\n\r?\n)([^]*?)(?=\r?\n--|$)/gi;
const BASE64_BODY_RE = /^[A-Za-z0-9+/=\s]+$/;
function substituteBinaryMimeParts(rfc822) {
    return rfc822.replace(BINARY_PART_RE, (_match, headerBlock, mime, partBody) => {
        const lowerMime = mime.toLowerCase();
        const bytes = lowerMime === 'application/pdf'
            ? (0, n8n_core_1.buildPdfWithText)(recoverIntendedText(partBody))
            : (0, n8n_core_1.synthesizeBinaryFixture)(lowerMime, `attachment.${lowerMime.split('/')[1]}`);
        const encoded = bytes.toString('base64').replace(/(.{76})/g, '$1\n');
        const header = /content-transfer-encoding:/i.test(headerBlock)
            ? headerBlock.replace(/content-transfer-encoding:[^\r\n]*/i, 'Content-Transfer-Encoding: base64')
            : headerBlock.replace(/(\r?\n\r?\n)$/, '\nContent-Transfer-Encoding: base64$1');
        return `${header}${encoded}`;
    });
}
function recoverIntendedText(partBody) {
    const trimmed = partBody.trim();
    if (trimmed.length === 0)
        return 'Mock PDF document';
    const looksBase64 = BASE64_BODY_RE.test(trimmed) && !/\s[a-z]+\s/i.test(trimmed);
    if (!looksBase64)
        return trimmed;
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    if (decoded.length > 0 && !decoded.startsWith('%PDF') && /^[\x20-\x7e\s]+$/.test(decoded)) {
        return decoded;
    }
    return 'Mock PDF document';
}
function looksLikeRfc822(text) {
    return /^[A-Za-z][A-Za-z0-9-]*:\s/m.test(text) && /\r?\n\r?\n/.test(text);
}
function materializeSpec(spec) {
    switch (spec.type) {
        case 'json':
            return {
                body: spec.body === undefined ? { ok: true } : spec.body,
                headers: { 'content-type': 'application/json', ...spec.headers },
                statusCode: 200,
            };
        case 'text':
            return {
                body: spec.textBody ?? '',
                headers: { 'content-type': spec.contentType || 'text/plain' },
                statusCode: 200,
            };
        case 'binary': {
            const filename = spec.filename ?? 'mock-file.dat';
            const contentType = spec.contentType ?? 'application/octet-stream';
            const body = (0, n8n_core_1.synthesizeBinaryFixture)(contentType, filename, {
                sizeHint: spec.sizeHint,
                text: spec.textBody,
            });
            return {
                body,
                headers: {
                    'content-type': contentType,
                    'content-disposition': `attachment; filename="${filename}"`,
                    'content-length': String(body.length),
                },
                statusCode: 200,
            };
        }
        case 'error': {
            const isTextError = typeof spec.textBody === 'string';
            return {
                body: isTextError ? spec.textBody : (spec.body ?? { error: 'Mock error' }),
                headers: {
                    'content-type': isTextError ? spec.contentType || 'text/plain' : 'application/json',
                },
                statusCode: spec.statusCode ?? 500,
            };
        }
        default:
            return {
                body: spec.body ?? { ok: true },
                headers: { 'content-type': 'application/json' },
                statusCode: 200,
            };
    }
}
function getContentType(headers) {
    if (!headers)
        return undefined;
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() !== 'content-type')
            continue;
        if (typeof value === 'string')
            return value;
        if (Array.isArray(value) && typeof value[0] === 'string')
            return value[0];
        return undefined;
    }
    return undefined;
}
function extractServiceName(url) {
    try {
        const hostname = new URL(url).hostname;
        const parts = hostname
            .replace(/^api\./, '')
            .replace(/^www\./, '')
            .split('.');
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    catch {
        return 'Unknown';
    }
}
function extractEndpoint(url) {
    try {
        const parsed = new URL(url);
        return parsed.pathname + (parsed.search ? parsed.search : '');
    }
    catch {
        return url;
    }
}
function extractEndpointPath(url) {
    try {
        return new URL(url).pathname;
    }
    catch {
        return url;
    }
}
function extractHostname(url) {
    try {
        return new URL(url).hostname;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=mock-handler.js.map