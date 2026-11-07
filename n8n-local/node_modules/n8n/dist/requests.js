"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendListQueryOptions = appendListQueryOptions;
exports.hasSharing = hasSharing;
function appendListQueryOptions(req, options) {
    const listReq = req;
    listReq.listQueryOptions = { ...listReq.listQueryOptions, ...options };
}
function hasSharing(workflows) {
    return workflows.some((w) => 'shared' in w);
}
//# sourceMappingURL=requests.js.map