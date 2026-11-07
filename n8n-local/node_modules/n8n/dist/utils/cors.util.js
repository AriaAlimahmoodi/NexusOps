"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCors = applyCors;
function applyCors(req, res) {
    if (res.getHeader('Access-Control-Allow-Origin')) {
        return;
    }
    const origin = req.headers.origin;
    if (!origin || origin === 'null') {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    else {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
//# sourceMappingURL=cors.util.js.map