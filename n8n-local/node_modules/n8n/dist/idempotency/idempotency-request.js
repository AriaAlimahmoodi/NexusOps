"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rememberRawBody = rememberRawBody;
exports.parseIdempotencyKey = parseIdempotencyKey;
exports.honorsIdempotencyKey = honorsIdempotencyKey;
exports.fingerprintParts = fingerprintParts;
exports.requestFingerprint = requestFingerprint;
const node_crypto_1 = require("node:crypto");
const is_record_1 = require("@n8n/utils/is-record");
const VISIBLE_ASCII = /^[\x21-\x7E]+$/;
const MAX_KEY_LENGTH = 128;
const IDEMPOTENT_POST_SEGMENTS = new Set([
    'activate',
    'deactivate',
    'disconnect',
    'publish',
    'unpublish',
    'archive',
    'unarchive',
    'transfer',
    'test',
    'test-trace',
]);
const rawBodies = new WeakMap();
function rememberRawBody(req, body) {
    rawBodies.set(req, body.toString(req.encoding || 'utf8'));
}
function parseIdempotencyKey(header) {
    if (header === undefined)
        return { kind: 'absent' };
    if (Array.isArray(header))
        return { kind: 'invalid' };
    const value = header.trim();
    if (value.length === 0)
        return { kind: 'absent' };
    if (value.length > MAX_KEY_LENGTH || !VISIBLE_ASCII.test(value))
        return { kind: 'invalid' };
    return { kind: 'present', value };
}
function honorsIdempotencyKey(method, path) {
    if (method.toUpperCase() !== 'POST')
        return false;
    const pathname = path.split('?')[0] ?? path;
    const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    const segment = trimmed.split('/').pop() ?? '';
    return !IDEMPOTENT_POST_SEGMENTS.has(segment);
}
function fingerprintParts(parts) {
    return (0, node_crypto_1.createHash)('sha256')
        .update(parts.method.toUpperCase())
        .update('\n')
        .update(parts.path)
        .update('\n')
        .update(parts.query)
        .update('\n')
        .update(parts.body)
        .digest('hex');
}
function requestFingerprint(req) {
    const target = req.originalUrl || req.url || '';
    const queryIndex = target.indexOf('?');
    const path = queryIndex === -1 ? target : target.slice(0, queryIndex);
    const query = queryIndex === -1 ? '' : target.slice(queryIndex + 1);
    return fingerprintParts({
        method: req.method ?? 'POST',
        path,
        query,
        body: requestBodyText(req),
    });
}
function isUploadedFile(value) {
    if (!(0, is_record_1.isRecord)(value))
        return false;
    return (typeof value.fieldname === 'string' &&
        typeof value.originalname === 'string' &&
        typeof value.size === 'number' &&
        (value.buffer === undefined || Buffer.isBuffer(value.buffer)));
}
function listUploadedFiles(files) {
    if (Array.isArray(files))
        return files.filter(isUploadedFile);
    if (!(0, is_record_1.isRecord)(files))
        return [];
    const listed = [];
    for (const value of Object.values(files)) {
        if (Array.isArray(value)) {
            listed.push(...value.filter(isUploadedFile));
        }
        else if (isUploadedFile(value)) {
            listed.push(value);
        }
    }
    return listed;
}
function uploadedFilesText(files) {
    return listUploadedFiles(files)
        .map((file) => {
        const content = (0, node_crypto_1.createHash)('sha256')
            .update(file.buffer ?? Buffer.alloc(0))
            .digest('hex');
        return `${file.fieldname}\n${file.originalname}\n${file.size}\n${content}`;
    })
        .join('\n');
}
function requestBodyText(req) {
    const remembered = rawBodies.get(req);
    if (remembered !== undefined)
        return remembered;
    if (Buffer.isBuffer(req.rawBody) && req.rawBody.length > 0) {
        return req.rawBody.toString(req.encoding || 'utf8');
    }
    const text = parsedBodyText(req.body);
    const files = uploadedFilesText(req.files);
    return files === '' ? text : `${text}\n${files}`;
}
function parsedBodyText(body) {
    if (body === undefined || body === null)
        return '';
    if (typeof body === 'string')
        return body;
    if (Buffer.isBuffer(body))
        return body.toString('utf8');
    return JSON.stringify(body);
}
//# sourceMappingURL=idempotency-request.js.map