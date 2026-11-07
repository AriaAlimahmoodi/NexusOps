"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyProviderShapeNormalizers = applyProviderShapeNormalizers;
exports.findProviderShapeViolation = findProviderShapeViolation;
const is_record_1 = require("@n8n/utils/is-record");
const n8n_core_1 = require("n8n-core");
let canvasPngB64;
function placeholderImageB64() {
    canvasPngB64 ??= (0, n8n_core_1.evalCanvasPng)().toString('base64');
    return canvasPngB64;
}
const DEFAULT_HUBSPOT_VID = 3234574;
function nowUnix() {
    return Math.floor(Date.now() / 1000);
}
function isOpenAiImagesGeneration(path) {
    return path.endsWith('/images/generations');
}
function isOpenAiCompletion(path) {
    if (/\/v\d+\/responses\/?$/.test(path))
        return 'responses';
    if (/\/chat\/completions\/?$/.test(path))
        return 'chat';
    return null;
}
function isGeminiGenerate(host, path) {
    return host === 'generativelanguage.googleapis.com' && path.includes('generatecontent');
}
function isRedditWrite(host, path, method) {
    if (method.toUpperCase() !== 'POST' || !host.includes('reddit.com'))
        return null;
    if (path.includes('api/comment'))
        return 'comment';
    if (path.includes('api/submit'))
        return 'submit';
    return null;
}
function isHubspotUpsert(host, path) {
    return host.includes('hubapi.com') && path.includes('/contacts/v1/contact/createorupdate');
}
function isGoogleDocsBatchUpdate(host, path) {
    return (host === 'docs.googleapis.com' && path.includes('/documents/') && path.includes(':batchupdate'));
}
function isGmailMessagesList(host, path, method) {
    return (method.toUpperCase() === 'GET' &&
        host.endsWith('googleapis.com') &&
        /\/gmail\/v1\/users\/[^/]+\/messages\/?$/.test(path));
}
function extractAnswerText(body) {
    if (body === null || body === undefined)
        return '';
    if (typeof body === 'string')
        return body;
    if (!(0, is_record_1.isRecord)(body))
        return String(body);
    if (typeof body.text === 'string')
        return body.text;
    if (typeof body.content === 'string')
        return body.content;
    if (typeof body.output_text === 'string')
        return body.output_text;
    if (typeof body.message === 'string')
        return body.message;
    return JSON.stringify(body);
}
function normalizeOpenAiImages(spec) {
    const body = spec.body;
    let base = {};
    let rawEntries;
    if ((0, is_record_1.isRecord)(body) && Array.isArray(body.data)) {
        base = body;
        rawEntries = body.data;
    }
    else if (Array.isArray(body)) {
        rawEntries = body;
    }
    else if ((0, is_record_1.isRecord)(body) && ('b64_json' in body || 'url' in body)) {
        rawEntries = [body];
    }
    else if ((0, is_record_1.isRecord)(body)) {
        base = body;
    }
    const entries = rawEntries && rawEntries.length > 0 ? rawEntries : [{}];
    const data = entries.map(coerceImageEntry);
    spec.body = { created: nowUnix(), ...base, data };
}
function coerceImageEntry(entry) {
    const base = (0, is_record_1.isRecord)(entry) ? entry : {};
    return { ...base, b64_json: placeholderImageB64() };
}
function normalizeOpenAiCompletionText(spec, kind) {
    const body = spec.body;
    if (!(0, is_record_1.isRecord)(body))
        return;
    if (kind === 'responses') {
        if (Array.isArray(body.output)) {
            for (const item of body.output) {
                if (!(0, is_record_1.isRecord)(item) || !Array.isArray(item.content))
                    continue;
                for (const part of item.content) {
                    if ((0, is_record_1.isRecord)(part) && 'text' in part && typeof part.text !== 'string') {
                        part.text = JSON.stringify(part.text);
                    }
                }
            }
        }
        if (body.output_text !== undefined && typeof body.output_text !== 'string') {
            body.output_text = JSON.stringify(body.output_text);
        }
        return;
    }
    if (Array.isArray(body.choices)) {
        for (const choice of body.choices) {
            if (!(0, is_record_1.isRecord)(choice) || !(0, is_record_1.isRecord)(choice.message))
                continue;
            const content = choice.message.content;
            if (content !== null && content !== undefined && typeof content !== 'string') {
                if (!Array.isArray(content))
                    choice.message.content = JSON.stringify(content);
            }
        }
    }
}
function normalizeGemini(spec) {
    if (hasGeminiCandidates(spec.body))
        return;
    const text = extractAnswerText(spec.body);
    spec.body = {
        candidates: [{ content: { parts: [{ text }], role: 'model' }, finishReason: 'STOP', index: 0 }],
        usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
    };
}
function hasGeminiCandidates(body) {
    if (!(0, is_record_1.isRecord)(body) || !Array.isArray(body.candidates) || body.candidates.length === 0) {
        return false;
    }
    const first = body.candidates[0];
    if (!(0, is_record_1.isRecord)(first) || !(0, is_record_1.isRecord)(first.content))
        return false;
    return Array.isArray(first.content.parts) && first.content.parts.length > 0;
}
function normalizeReddit(spec, kind) {
    const inner = extractRedditData(spec.body);
    const data = kind === 'comment' ? ensureRedditThings(inner) : inner;
    spec.body = { json: { errors: existingRedditErrors(spec.body), data } };
}
function extractRedditData(body) {
    if ((0, is_record_1.isRecord)(body) && (0, is_record_1.isRecord)(body.json) && (0, is_record_1.isRecord)(body.json.data)) {
        return body.json.data;
    }
    if ((0, is_record_1.isRecord)(body) && (0, is_record_1.isRecord)(body.data))
        return body.data;
    if ((0, is_record_1.isRecord)(body))
        return body;
    return {};
}
function existingRedditErrors(body) {
    if ((0, is_record_1.isRecord)(body) && (0, is_record_1.isRecord)(body.json) && Array.isArray(body.json.errors)) {
        return body.json.errors;
    }
    return [];
}
function ensureRedditThings(data) {
    if (Array.isArray(data.things) && (0, is_record_1.isRecord)(data.things[0]) && data.things[0].data) {
        return data;
    }
    return { things: [{ kind: 't1', data }] };
}
function normalizeHubspotUpsert(spec) {
    const body = (0, is_record_1.isRecord)(spec.body) ? spec.body : {};
    spec.body = {
        ...body,
        vid: resolveHubspotVid(body),
        isNew: typeof body.isNew === 'boolean' ? body.isNew : true,
    };
}
function resolveHubspotVid(body) {
    for (const candidate of [body.vid, body['canonical-vid'], body.id]) {
        if (typeof candidate === 'number' && Number.isFinite(candidate))
            return candidate;
        if (typeof candidate === 'string' && /^\d+$/.test(candidate))
            return Number(candidate);
    }
    return DEFAULT_HUBSPOT_VID;
}
function normalizeGmailMessagesList(spec) {
    if (!Array.isArray(spec.body))
        return;
    spec.body = { messages: spec.body, resultSizeEstimate: spec.body.length };
}
function normalizeGoogleDocsBatchUpdate(spec) {
    const body = (0, is_record_1.isRecord)(spec.body) ? spec.body : {};
    const replies = Array.isArray(body.replies) && body.replies.length > 0 ? body.replies : [{}];
    spec.body = { ...body, replies };
}
function applyProviderShapeNormalizers(info, spec) {
    if (spec.type !== 'json')
        return;
    const path = info.pathname.toLowerCase();
    const host = (info.hostname ?? '').toLowerCase();
    if (isOpenAiImagesGeneration(path))
        return normalizeOpenAiImages(spec);
    const completionKind = isOpenAiCompletion(path);
    if (completionKind)
        return normalizeOpenAiCompletionText(spec, completionKind);
    if (isGeminiGenerate(host, path))
        return normalizeGemini(spec);
    const redditKind = isRedditWrite(host, path, info.method);
    if (redditKind)
        return normalizeReddit(spec, redditKind);
    if (isHubspotUpsert(host, path))
        return normalizeHubspotUpsert(spec);
    if (isGoogleDocsBatchUpdate(host, path))
        return normalizeGoogleDocsBatchUpdate(spec);
    if (isGmailMessagesList(host, path, info.method))
        return normalizeGmailMessagesList(spec);
}
function findProviderShapeViolation(info, body) {
    const path = info.pathname.toLowerCase();
    const host = (info.hostname ?? '').toLowerCase();
    if (isOpenAiImagesGeneration(path))
        return openAiImagesViolation(body);
    const completionKind = isOpenAiCompletion(path);
    if (completionKind)
        return openAiCompletionTextViolation(body, completionKind);
    if (isGeminiGenerate(host, path))
        return geminiViolation(body);
    const redditKind = isRedditWrite(host, path, info.method);
    if (redditKind)
        return redditViolation(body, redditKind);
    if (isHubspotUpsert(host, path))
        return hubspotViolation(body);
    if (isGoogleDocsBatchUpdate(host, path))
        return googleDocsViolation(body);
    if (isGmailMessagesList(host, path, info.method))
        return gmailMessagesListViolation(body);
    return undefined;
}
function gmailMessagesListViolation(body) {
    if (!Array.isArray(body))
        return undefined;
    return 'Invalid: Gmail messages.list returns an OBJECT envelope `{ "messages": [{ "id", "threadId" }, ...], "resultSizeEstimate": <n> }` — the node reads response.messages, so a bare array yields zero messages. Resubmit wrapped in that envelope.';
}
function openAiImagesViolation(body) {
    const data = (0, is_record_1.isRecord)(body) ? body.data : undefined;
    if (!Array.isArray(data) || data.length === 0) {
        return 'Invalid: OpenAI /v1/images/generations must return a JSON object with a `data` ARRAY of image objects, e.g. `{ "created": <unix>, "data": [{ "b64_json": "..." }] }`. Resubmit with that envelope.';
    }
    const brokenEntry = data.some((entry) => !(0, is_record_1.isRecord)(entry) || (typeof entry.b64_json !== 'string' && typeof entry.url !== 'string'));
    if (brokenEntry) {
        return 'Invalid: every OpenAI image `data[]` entry must carry a `b64_json` (base64 string) — the node decodes it. Resubmit with `data: [{ "b64_json": "..." }]`.';
    }
    return undefined;
}
function openAiCompletionTextViolation(body, kind) {
    if (!(0, is_record_1.isRecord)(body))
        return undefined;
    if (kind === 'responses' && Array.isArray(body.output)) {
        for (const item of body.output) {
            if (!(0, is_record_1.isRecord)(item) || !Array.isArray(item.content))
                continue;
            for (const part of item.content) {
                if ((0, is_record_1.isRecord)(part) && 'text' in part && typeof part.text !== 'string') {
                    return 'Invalid: OpenAI /v1/responses `output[].content[].text` must be a STRING — when the answer is JSON, JSON-encode it into the string (e.g. "{\\"quotes\\":[...]}"), never embed the parsed object. Resubmit with `text` as a string.';
                }
            }
        }
    }
    if (kind === 'chat' && Array.isArray(body.choices)) {
        for (const choice of body.choices) {
            if (!(0, is_record_1.isRecord)(choice) || !(0, is_record_1.isRecord)(choice.message))
                continue;
            const content = choice.message.content;
            if (content !== null && content !== undefined && typeof content !== 'string') {
                if (!Array.isArray(content)) {
                    return 'Invalid: chat/completions `choices[].message.content` must be a STRING (or null with tool_calls) — when the answer is JSON, JSON-encode it into the string, never embed the parsed object. Resubmit with `content` as a string.';
                }
            }
        }
    }
    return undefined;
}
function geminiViolation(body) {
    if (hasGeminiCandidates(body))
        return undefined;
    return 'Invalid: Google Gemini responses must use the full envelope `{ "candidates": [{ "content": { "parts": [{ "text": "..." }] } }] }` — the node reads candidates[].content.parts[].text. Resubmit wrapped in that shape.';
}
function redditViolation(body, kind) {
    const data = (0, is_record_1.isRecord)(body) && (0, is_record_1.isRecord)(body.json) ? body.json.data : undefined;
    if (!(0, is_record_1.isRecord)(data)) {
        return 'Invalid: Reddit write responses must use the `{ "json": { "errors": [], "data": { ... } } }` envelope — the node reads response.json.data. Resubmit wrapped in that shape.';
    }
    if (kind === 'comment') {
        const things = data.things;
        if (!Array.isArray(things) || !(0, is_record_1.isRecord)(things[0]) || !things[0].data) {
            return 'Invalid: Reddit api/comment responses put the comment under `json.data.things[0].data`. Resubmit with `{ "json": { "data": { "things": [{ "kind": "t1", "data": { ... } }] } } }`.';
        }
    }
    return undefined;
}
function hubspotViolation(body) {
    const vid = (0, is_record_1.isRecord)(body) ? body.vid : undefined;
    if (typeof vid === 'number' || (typeof vid === 'string' && /^\d+$/.test(vid)))
        return undefined;
    return 'Invalid: HubSpot contacts/v1 createOrUpdate returns `{ "vid": <number>, "isNew": <bool> }` — the node reads response.vid. Resubmit with a numeric `vid`.';
}
function googleDocsViolation(body) {
    const replies = (0, is_record_1.isRecord)(body) ? body.replies : undefined;
    if (Array.isArray(replies) && replies.length > 0)
        return undefined;
    return 'Invalid: Google Docs batchUpdate returns `{ "documentId": "...", "replies": [ ... ] }` with one reply per request — the node reads response.replies[0]. Resubmit with a non-empty `replies` array.';
}
//# sourceMappingURL=provider-shapes.js.map