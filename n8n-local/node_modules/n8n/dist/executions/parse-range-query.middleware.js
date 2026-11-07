"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRangeQuery = void 0;
const jsonschema_1 = require("jsonschema");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const ResponseHelper = __importStar(require("../response-helper"));
const execution_cursor_1 = require("./execution-cursor");
const execution_service_1 = require("./execution.service");
const isValid = (arg) => (0, jsonschema_1.validate)(arg, execution_service_1.schemaGetExecutionsQueryFilter).valid;
function parseFilter(rawFilter, rangeQuery) {
    if (typeof rawFilter !== 'string')
        return rangeQuery;
    const jsonFilter = (0, n8n_workflow_1.jsonParse)(rawFilter, {
        errorMessage: 'Failed to parse query string',
    });
    for (const key of Object.keys(jsonFilter)) {
        if (!execution_service_1.allowedExecutionsQueryFilterFields.includes(key))
            delete jsonFilter[key];
    }
    if (!isValid(jsonFilter))
        throw new n8n_workflow_1.UnexpectedError('Query does not match schema');
    return { ...rangeQuery, ...jsonFilter };
}
const parseRangeQuery = (req, res, next) => {
    const { limit, firstId, lastId } = req.query;
    try {
        if (firstId !== undefined || lastId !== undefined)
            throw new errors_1.BadRequestError('Use cursor to load execution pages. Your n8n instance has most likely updated. Please refresh the page.');
        if (req.query.cursor !== undefined && typeof req.query.cursor !== 'string')
            throw new errors_1.BadRequestError('Invalid execution cursor');
        const cursor = req.query.cursor === undefined ? undefined : (0, execution_cursor_1.parseExecutionCursor)(req.query.cursor);
        const pageLimit = limit === undefined ? 20 : Number(limit);
        if (!Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 100)
            throw new errors_1.BadRequestError('Execution limit must be between 1 and 100');
        const rangeQuery = parseFilter(req.query.filter, {
            kind: 'range',
            range: {
                limit: pageLimit,
            },
        });
        Object.assign(req, { rangeQuery, cursor });
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            ResponseHelper.sendErrorResponse(res, new errors_1.BadRequestError(error.message));
        }
    }
};
exports.parseRangeQuery = parseRangeQuery;
//# sourceMappingURL=parse-range-query.middleware.js.map