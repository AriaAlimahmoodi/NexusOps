"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertContentType = assertContentType;
const errors_1 = require("@n8n/errors");
function readMediaType(header) {
    const [rawMediaType, ...parameterParts] = header.split(';');
    const mediaType = rawMediaType.trim().toLowerCase();
    const parameters = new Map();
    for (const part of parameterParts) {
        const separator = part.indexOf('=');
        if (separator === -1) {
            continue;
        }
        const name = part.slice(0, separator).trim().toLowerCase();
        if (name === 'boundary') {
            continue;
        }
        const value = part.slice(separator + 1);
        parameters.set(name, name === 'charset' ? value.toLowerCase() : value);
    }
    const reported = [...parameters.entries()]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .reduce((out, [name, value]) => `${out}; ${name}=${value}`, mediaType);
    return { mediaType, reported };
}
function assertContentType({ header, expected, bodyRequired, }) {
    const { mediaType, reported } = readMediaType(header ?? '');
    if (mediaType === '') {
        if (bodyRequired) {
            throw new errors_1.UnsupportedMediaTypeError('unsupported media type undefined');
        }
        return false;
    }
    if (mediaType !== expected) {
        throw new errors_1.UnsupportedMediaTypeError(`unsupported media type ${reported}`);
    }
    return true;
}
//# sourceMappingURL=content-type.js.map