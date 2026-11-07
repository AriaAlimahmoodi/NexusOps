"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSON_REQUEST_BODY_MEDIA = exports.REQUEST_BODY_HANDLERS = void 0;
const json_request_body_1 = require("./json.request-body");
const multipart_request_body_1 = require("./multipart.request-body");
exports.REQUEST_BODY_HANDLERS = {
    'application/json': json_request_body_1.jsonRequestBody,
    'multipart/form-data': multipart_request_body_1.multipartRequestBody,
};
exports.JSON_REQUEST_BODY_MEDIA = { mediaType: 'application/json' };
//# sourceMappingURL=index.js.map