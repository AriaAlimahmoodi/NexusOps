"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactBinaryBody = redactBinaryBody;
const BINARY_CONTENT_TYPE_RE = /^(?:image|audio|video|application\/(?:pdf|octet-stream|zip))/i;
function isFormDataLike(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const candidate = value;
    return typeof candidate.getBoundary === 'function' && Array.isArray(candidate._streams);
}
function summarizeFormData(fd) {
    const parts = [];
    const streams = Array.isArray(fd._streams) ? fd._streams : [];
    for (const entry of streams) {
        if (typeof entry !== 'string')
            continue;
        if (!entry.includes('Content-Disposition'))
            continue;
        const nameMatch = /name="([^"]+)"/.exec(entry);
        if (!nameMatch)
            continue;
        const filenameMatch = /filename="([^"]+)"/.exec(entry);
        const contentTypeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(entry);
        parts.push({
            name: nameMatch[1],
            filename: filenameMatch?.[1],
            contentType: contentTypeMatch?.[1]?.trim(),
        });
    }
    return {
        __redacted: 'multipart',
        boundary: typeof fd.getBoundary === 'function' ? fd.getBoundary() : undefined,
        parts,
    };
}
function summarizeBuffer(buf, contentType) {
    return {
        __redacted: 'buffer',
        contentType: contentType ?? 'application/octet-stream',
        size: buf.length,
    };
}
function summarizeString(text, contentType) {
    return {
        __redacted: 'binary',
        contentType,
        size: Buffer.byteLength(text, 'utf8'),
    };
}
function redactBinaryBody(body, contentType) {
    if (body === null || body === undefined)
        return body;
    if (Buffer.isBuffer(body)) {
        return summarizeBuffer(body, contentType);
    }
    if (isFormDataLike(body)) {
        return summarizeFormData(body);
    }
    if (typeof body === 'string' && contentType && BINARY_CONTENT_TYPE_RE.test(contentType)) {
        return summarizeString(body, contentType);
    }
    if (Array.isArray(body)) {
        return body.map((value) => redactBinaryBody(value));
    }
    if (typeof body === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(body)) {
            result[key] = redactBinaryBody(value);
        }
        return result;
    }
    return body;
}
//# sourceMappingURL=request-binary-redactor.js.map