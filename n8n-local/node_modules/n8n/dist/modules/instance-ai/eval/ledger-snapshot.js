"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotLedgerBody = snapshotLedgerBody;
function snapshotLedgerBody(body) {
    if (typeof body !== 'object' || body === null)
        return body;
    if (Buffer.isBuffer(body))
        return Buffer.from(body);
    return structuredClone(body);
}
//# sourceMappingURL=ledger-snapshot.js.map