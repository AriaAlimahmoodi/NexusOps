"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPushRequest = isPushRequest;
exports.isSSEPushRequest = isSSEPushRequest;
exports.isWebSocketPushRequest = isWebSocketPushRequest;
exports.isPushResponse = isPushResponse;
function isPushRequest(req) {
    return 'pushRef' in req.query && typeof req.query.pushRef === 'string';
}
function isSSEPushRequest(req) {
    const hasWs = 'ws' in req;
    return isPushRequest(req) && (!hasWs || req.ws === undefined);
}
function isWebSocketPushRequest(req) {
    return isPushRequest(req) && 'ws' in req && req.ws !== undefined;
}
function isPushResponse(res) {
    return 'req' in res && isPushRequest(res.req);
}
//# sourceMappingURL=push-helpers.js.map