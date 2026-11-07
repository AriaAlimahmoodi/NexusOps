"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scimBodyParser = void 0;
const errors_1 = require("@n8n/errors");
const n8n_workflow_1 = require("n8n-workflow");
const scimBodyParser = (req, _res, next) => {
    if (req.contentType !== 'application/scim+json' || !req.rawBody?.length)
        return next();
    try {
        const text = req.rawBody.toString(req.encoding);
        req.body = (0, n8n_workflow_1.jsonParse)(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
    }
    catch (error) {
        return next(new errors_1.UnprocessableRequestError('Failed to parse request body', error.message));
    }
    return next();
};
exports.scimBodyParser = scimBodyParser;
//# sourceMappingURL=scim-body-parser.js.map