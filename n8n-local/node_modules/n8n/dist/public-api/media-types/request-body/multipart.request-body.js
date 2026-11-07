"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipartRequestBody = void 0;
exports.toPublicApiError = toPublicApiError;
const errors_1 = require("@n8n/errors");
const public_api_validation_error_1 = require("../../../public-api/public-api-validation-error");
const multipart_parser_1 = require("./multipart-parser");
const PAYLOAD_TOO_BIG_CODE = /LIMIT_(FILE|PART)_(SIZE|COUNT)/;
const UNEXPECTED_FILE_CODE = /LIMIT_UNEXPECTED_FILE/;
const MISSING_BOUNDARY = /Multipart: Boundary not found/i;
function isMulterError(error) {
    return error instanceof Error && error.name === 'MulterError';
}
function toPublicApiError(error) {
    if (isMulterError(error)) {
        if (PAYLOAD_TOO_BIG_CODE.test(error.code)) {
            return new errors_1.ContentTooLargeError(error.message);
        }
        if (UNEXPECTED_FILE_CODE.test(error.code)) {
            return new errors_1.InternalServerError(error.message);
        }
        return new errors_1.BadRequestError(error.message);
    }
    const message = error instanceof Error ? error.message : String(error);
    if (MISSING_BOUNDARY.test(message)) {
        return new errors_1.BadRequestError('multipart file(s) required');
    }
    return new errors_1.InternalServerError(message);
}
function listFiles(files) {
    if (!files)
        return [];
    return Array.isArray(files) ? files : Object.values(files).flat();
}
function mergeMultipartInput(req) {
    const input = Object.create(null);
    for (const [key, value] of Object.entries(req.body ?? {})) {
        input[key] = value;
    }
    const filesByField = new Map();
    for (const file of listFiles(req.files)) {
        const existing = filesByField.get(file.fieldname);
        if (existing) {
            existing.push(file);
        }
        else {
            filesByField.set(file.fieldname, [file]);
        }
    }
    for (const [fieldname, files] of filesByField) {
        input[fieldname] = files.length === 1 ? files[0] : files;
    }
    return input;
}
exports.multipartRequestBody = {
    mediaType: 'multipart/form-data',
    errorStatuses: [413, 415, 500],
    discoverable: false,
    async parseBody(media, req, res) {
        if (media.mediaType !== 'multipart/form-data') {
            throw new errors_1.UnexpectedError('multipartRequestBody.parseBody called with a non-multipart media type');
        }
        const parse = await (0, multipart_parser_1.loadMultipartParser)(media.uploadLimits());
        await new Promise((resolve, reject) => {
            void parse(req, res, (error) => {
                if (error) {
                    reject(toPublicApiError(error));
                    return;
                }
                resolve();
            });
        });
    },
    readInput(req) {
        return mergeMultipartInput(req);
    },
    formatValidationError(error) {
        const [issue] = error.errors;
        if (issue?.code === 'unrecognized_keys' && issue.keys.length > 0) {
            return `Unexpected form field "${issue.keys[0]}"`;
        }
        return (0, public_api_validation_error_1.formatValidationError)('body', error);
    },
};
//# sourceMappingURL=multipart.request-body.js.map