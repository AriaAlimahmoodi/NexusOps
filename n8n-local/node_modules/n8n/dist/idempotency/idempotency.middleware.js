"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDEMPOTENCY_KEY_MISMATCH_MESSAGE = exports.IDEMPOTENCY_KEY_IN_PROGRESS_MESSAGE = exports.IDEMPOTENCY_KEY_INVALID_MESSAGE = void 0;
exports.createIdempotencyMiddleware = createIdempotencyMiddleware;
exports.takeIdempotencyClaimId = takeIdempotencyClaimId;
const db_1 = require("@n8n/db");
const idempotency_request_1 = require("../idempotency/idempotency-request");
exports.IDEMPOTENCY_KEY_INVALID_MESSAGE = 'Idempotency-Key must be 1 to 128 visible ASCII characters.';
exports.IDEMPOTENCY_KEY_IN_PROGRESS_MESSAGE = 'A request with this Idempotency-Key is already in progress.';
exports.IDEMPOTENCY_KEY_MISMATCH_MESSAGE = 'This Idempotency-Key was already used with a different request.';
const IDEMPOTENCY_CLAIM_LOCAL = 'idempotencyClaimId';
function createIdempotencyMiddleware(store) {
    return async (req, res, next) => {
        try {
            const key = idempotencyKeyFor(req, res);
            if (!key) {
                if (!res.headersSent)
                    next();
                return;
            }
            const claim = await store.claim({
                userId: key.userId,
                idempotencyKey: key.value,
                fingerprint: (0, idempotency_request_1.requestFingerprint)(req),
            });
            applyClaim(res, claim, () => next());
        }
        catch (error) {
            if (res.headersSent)
                return;
            next(error);
        }
    };
}
function takeIdempotencyClaimId(res) {
    const id = res.locals[IDEMPOTENCY_CLAIM_LOCAL];
    if (typeof id !== 'string')
        return undefined;
    delete res.locals[IDEMPOTENCY_CLAIM_LOCAL];
    return id;
}
function idempotencyKeyFor(req, res) {
    if (!(0, db_1.isAuthenticatedRequest)(req))
        return undefined;
    if (!(0, idempotency_request_1.honorsIdempotencyKey)(req.method, req.originalUrl || req.url))
        return undefined;
    const parsed = (0, idempotency_request_1.parseIdempotencyKey)(req.headers['idempotency-key']);
    if (parsed.kind === 'absent')
        return undefined;
    if (parsed.kind === 'invalid') {
        res.status(400).json({ message: exports.IDEMPOTENCY_KEY_INVALID_MESSAGE });
        return undefined;
    }
    return { userId: req.user.id, value: parsed.value };
}
function applyClaim(res, claim, onClaimed) {
    switch (claim.outcome) {
        case 'replay':
            sendStored(res, claim.responseStatus, claim.responseBody);
            return;
        case 'processing':
            res.status(409).json({ message: exports.IDEMPOTENCY_KEY_IN_PROGRESS_MESSAGE });
            return;
        case 'mismatch':
            res.status(422).json({ message: exports.IDEMPOTENCY_KEY_MISMATCH_MESSAGE });
            return;
        case 'claimed':
            res.locals[IDEMPOTENCY_CLAIM_LOCAL] = claim.id;
            onClaimed();
            return;
    }
}
function sendStored(res, status, body) {
    if (status === 204 || body === null) {
        res.status(status).send();
        return;
    }
    res.status(status).json(body);
}
//# sourceMappingURL=idempotency.middleware.js.map